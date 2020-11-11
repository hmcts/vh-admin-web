using AdminWebsite.Attributes;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Extensions;
using AdminWebsite.Helper;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.VideoAPI.Client;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AddEndpointRequest = AdminWebsite.BookingsAPI.Client.AddEndpointRequest;
using ParticipantRequest = AdminWebsite.BookingsAPI.Client.ParticipantRequest;
using UpdateEndpointRequest = AdminWebsite.BookingsAPI.Client.UpdateEndpointRequest;
using UpdateParticipantRequest = AdminWebsite.BookingsAPI.Client.UpdateParticipantRequest;

namespace AdminWebsite.Controllers
{
    /// <summary>
    /// Responsible for retrieving and storing hearing information
    /// </summary>
    [Produces("application/json")]
    [Route("api/hearings")]
    [ApiController]
    public class HearingsController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly IUserIdentity _userIdentity;
        private readonly IUserAccountService _userAccountService;
        private readonly IValidator<EditHearingRequest> _editHearingRequestValidator;
        private readonly IVideoApiClient _videoApiClient;
        private readonly IPollyRetryService _pollyRetryService;
        private readonly ILogger<HearingsController> _logger;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public HearingsController(IBookingsApiClient bookingsApiClient, IUserIdentity userIdentity,
            IUserAccountService userAccountService, IValidator<EditHearingRequest> editHearingRequestValidator,
            IVideoApiClient videoApiClient, IPollyRetryService pollyRetryService,
            ILogger<HearingsController> logger)
        {
            _bookingsApiClient = bookingsApiClient;
            _userIdentity = userIdentity;
            _userAccountService = userAccountService;
            _editHearingRequestValidator = editHearingRequestValidator;
            _videoApiClient = videoApiClient;
            _pollyRetryService = pollyRetryService;
            _logger = logger;
        }

        /// <summary>
        /// Create a hearing
        /// </summary>
        /// <param name="request">Hearing Request object</param>
        /// <returns>VideoHearingId</returns>
        [HttpPost]
        [SwaggerOperation(OperationId = "BookNewHearing")]
        [ProducesResponseType(typeof(HearingDetailsResponse), (int) HttpStatusCode.Created)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [HearingInputSanitizer]
        public async Task<ActionResult<HearingDetailsResponse>> Post([FromBody] BookNewHearingRequest request)
        {
            var usernameAdIdDict = new Dictionary<string, string>();
            try
            {
                var nonJudgeParticipants = request.Participants.Where(p => p.Case_role_name != "Judge").ToList();
                await PopulateUserIdsAndUsernames(nonJudgeParticipants, usernameAdIdDict);

                if (request.Endpoints != null && request.Endpoints.Any())
                {
                    var endpointsWithDa = request.Endpoints
                        .Where(x => !string.IsNullOrWhiteSpace(x.Defence_advocate_username)).ToList();
                    AssignEndpointDefenceAdvocates(endpointsWithDa, request.Participants.AsReadOnly());

                }

                request.Created_by = _userIdentity.GetUserIdentityName();
                _logger.LogDebug("Attempting to send booking request to Booking API");
                var hearingDetailsResponse = await _bookingsApiClient.BookNewHearingAsync(request);
                _logger.LogDebug("Successfully booked hearing {hearing}", hearingDetailsResponse.Id);
                _logger.LogDebug("Attempting assign participants to the correct group");
                await AssignParticipantToCorrectGroups(hearingDetailsResponse, usernameAdIdDict);
                _logger.LogDebug("Successfully assigned participants to the correct group", hearingDetailsResponse.Id);
                return Created("", hearingDetailsResponse);
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e,
                    "There was a problem saving the booking. Status Code {StatusCode} - Message {Message}",
                    e.StatusCode, e.Response);
                if (e.StatusCode == (int) HttpStatusCode.BadRequest)
                {
                    return BadRequest(e.Response);
                }

                throw;
            }
        }

        private async Task PopulateUserIdsAndUsernames(IList<ParticipantRequest> participants,
            Dictionary<string, string> usernameAdIdDict)
        {
            _logger.LogDebug("Assigning HMCTS usernames for participants");
            foreach (var participant in participants)
            {
                // set the participant username according to AD
                string adUserId;
                if (string.IsNullOrWhiteSpace(participant.Username))
                {
                    _logger.LogDebug("No username provided in booking for participant {email}. Checking AD by contact email",
                        participant.Contact_email);
                    adUserId = await _userAccountService.UpdateParticipantUsername(participant);
                }
                else
                {
                    // get user
                    _logger.LogDebug(
                        "Username provided in booking for participant {email}. Getting id for username {username}",
                        participant.Contact_email, participant.Username);
                    adUserId = await _userAccountService.GetAdUserIdForUsername(participant.Username);
                }
                // username's participant will be set by this point
                usernameAdIdDict[participant.Username!] = adUserId;
            }
        }

        private void AssignEndpointDefenceAdvocates(List<EndpointRequest> endpointsWithDa, IReadOnlyCollection<ParticipantRequest> participants)
        {
            // update the username of defence advocate 
            foreach (var endpoint in endpointsWithDa)
            {
                _logger.LogDebug("Attempting to find defence advocate {da} for endpoint {ep}",
                    endpoint.Defence_advocate_username, endpoint.Display_name);
                var defenceAdvocate = participants.Single(x =>
                    x.Username.Equals(endpoint.Defence_advocate_username,
                        StringComparison.CurrentCultureIgnoreCase));
                endpoint.Defence_advocate_username = defenceAdvocate.Username;
            }
        }

        /// <summary>
        /// Clone hearings with the details of a given hearing on given dates
        /// </summary>
        /// <param name="hearingId">Original hearing to clone</param>
        /// <param name="hearingRequest">The dates range to create the new hearings on</param>
        /// <returns></returns>
        [HttpPost("{hearingId}/clone")]
        [SwaggerOperation(OperationId = "CloneHearing")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> CloneHearing(Guid hearingId, [FromBody]MultiHearingRequest hearingRequest)
        {
            _logger.LogDebug("Attempting to clone hearing {hearing}", hearingId);
            var listOfDates = DateListMapper.GetListOfWorkingDates(hearingRequest.StartDate, hearingRequest.EndDate);
            if (listOfDates.Count == 0)
            {
                _logger.LogWarning("No working dates provided to clone to");
                return BadRequest();
            }
            var cloneHearingRequest = new CloneHearingRequest { Dates = listOfDates };
            try
            {
                _logger.LogDebug("Sending request to clone hearing to Bookings API");
                await _bookingsApiClient.CloneHearingAsync(hearingId, cloneHearingRequest);
                _logger.LogDebug("Successfully cloned hearing {hearing}", hearingId);
                return NoContent();
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e,
                    "There was a problem cloning the booking. Status Code {StatusCode} - Message {Message}",
                    e.StatusCode, e.Response);
                if (e.StatusCode == (int)HttpStatusCode.BadRequest)
                {
                    return BadRequest(e.Response);
                }
                throw;
            }
        }


        /// <summary>
        /// Edit a hearing
        /// </summary>
        /// <param name="hearingId">The id of the hearing to update</param>
        /// <param name="request">Hearing Request object for edit operation</param>
        /// <returns>VideoHearingId</returns>
        [HttpPut("{hearingId}")]
        [SwaggerOperation(OperationId = "EditHearing")]
        [ProducesResponseType(typeof(HearingDetailsResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [HearingInputSanitizer]
        public async Task<ActionResult<HearingDetailsResponse>> EditHearing(Guid hearingId, [FromBody] EditHearingRequest request)
        {
            var usernameAdIdDict = new Dictionary<string, string>();
            if (hearingId == Guid.Empty)
            {
                _logger.LogWarning("No hearing id found to edit");
                ModelState.AddModelError(nameof(hearingId), $"Please provide a valid {nameof(hearingId)}");
                return BadRequest(ModelState);
            }
            _logger.LogDebug("Attempting to edit hearing {hearing}", hearingId);

            var result = _editHearingRequestValidator.Validate(request);

            if (!result.IsValid)
            {
                _logger.LogWarning("Failed edit hearing validation");
                ModelState.AddFluentValidationErrors(result.Errors);
                return BadRequest(ModelState);
            }

            HearingDetailsResponse hearing;
            try
            {
                hearing = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e,
                    "Failed to get hearing {hearing}. Status Code {StatusCode} - Message {Message}",
                    hearingId, e.StatusCode, e.Response);
                if (e.StatusCode != (int)HttpStatusCode.NotFound)
                    throw;

                return NotFound($"No hearing with id found [{hearingId}]");
            }

            try
            {
                //Save hearing details
                var updateHearingRequest = MapHearingUpdateRequest(request);
                await _bookingsApiClient.UpdateHearingDetailsAsync(hearingId, updateHearingRequest);

                var newParticipantList = new List<ParticipantRequest>();

                foreach (var participant in request.Participants)
                {
                    if (!participant.Id.HasValue)
                    {
                        // Add a new participant
                        // Map the request except the username
                        var newParticipant = MapNewParticipantRequest(participant);
                        // Judge is manually created in AD, no need to create one
                        if (participant.CaseRoleName == "Judge")
                        {
                            if (hearing.Participants != null && hearing.Participants.Any(p => p.Username.Equals(participant.ContactEmail)))
                            {
                                //If the judge already exists in the database, there is no need to add again.
                                continue;
                            }
                            newParticipant.Username = participant.ContactEmail;
                        }
                        else
                        {
                            // Update the request with newly created user details in AD
                            var userId = await _userAccountService.UpdateParticipantUsername(newParticipant);
                            usernameAdIdDict.Add(newParticipant.Username, userId);
                        }

                        _logger.LogDebug("Adding participant {participant} to hearing {hearing}",
                            newParticipant.Display_name, hearingId);
                        newParticipantList.Add(newParticipant);
                    }
                    else
                    {
                        var existingParticipant = hearing.Participants.FirstOrDefault(p => p.Id.Equals(participant.Id));
                        if (existingParticipant != null)
                        {
                            if (existingParticipant.User_role_name == "Individual" || existingParticipant.User_role_name == "Representative")
                            {
                                //Update participant
                                _logger.LogDebug("Updating existing participant {participant} in hearing {hearing}",
                                    existingParticipant.Id, hearingId);
                                var updateParticipantRequest = MapUpdateParticipantRequest(participant);
                                await _bookingsApiClient.UpdateParticipantDetailsAsync(hearingId, participant.Id.Value, updateParticipantRequest);
                            }
                            else if (existingParticipant.User_role_name == "Judge")
                            {
                                //Update Judge
                                _logger.LogDebug("Updating judge {participant} in hearing {hearing}",
                                    existingParticipant.Id, hearingId);
                                var updateParticipantRequest = new UpdateParticipantRequest
                                {
                                    Display_name = participant.DisplayName
                                };
                                await _bookingsApiClient.UpdateParticipantDetailsAsync(hearingId, participant.Id.Value, updateParticipantRequest);
                            }
                        }
                    }
                }

                // Delete existing participants if the request doesn't contain any update information
                hearing.Participants ??= new List<ParticipantResponse>();
                var deleteParticipantList = hearing.Participants.Where(p => request.Participants.All(rp => rp.Id != p.Id));
                foreach (var participantToDelete in deleteParticipantList)
                {
                    _logger.LogDebug("Removing existing participant {participant} from hearing {hearing}",
                        participantToDelete.Id, hearingId);
                    await _bookingsApiClient.RemoveParticipantFromHearingAsync(hearingId, participantToDelete.Id);
                }

                // Add new participants
                if (newParticipantList.Any())
                {
                    _logger.LogDebug("Saving new participants {participantCount} to hearing {hearing}",
                        newParticipantList.Count, hearingId);
                    await _bookingsApiClient.AddParticipantsToHearingAsync(hearingId, new AddParticipantsToHearingRequest()
                    {
                        Participants = newParticipantList
                    });
                }

                // endpoints.
                if (hearing.Endpoints != null)
                {
                    var listOfEndpointsToDelete = hearing.Endpoints.Where(e => request.Endpoints.All(re => re.Id != e.Id));
                    foreach (var endpointToDelete in listOfEndpointsToDelete)
                    {
                        _logger.LogDebug("Removing endpoint {endpoint} - {endpointDisplayName} from hearing {hearing}",
                            endpointToDelete.Id, endpointToDelete.Display_name, hearingId);
                        await _bookingsApiClient.RemoveEndPointFromHearingAsync(hearing.Id, endpointToDelete.Id);
                    }
                    foreach (var endpoint in request.Endpoints)
                    {
                        var epToUpdate = newParticipantList
                            .Find(p => p.Contact_email.Equals(endpoint.DefenceAdvocateUsername, StringComparison.CurrentCultureIgnoreCase));
                        if (epToUpdate != null)
                        {
                            endpoint.DefenceAdvocateUsername = epToUpdate.Username;
                        }

                        if (!endpoint.Id.HasValue)
                        {
                            _logger.LogDebug("Adding endpoint {endpointDisplayName} to hearing {hearing}",
                                endpoint.DisplayName, hearingId);
                            var addEndpointRequest = new AddEndpointRequest { Display_name = endpoint.DisplayName, Defence_advocate_username = endpoint.DefenceAdvocateUsername };
                            await _bookingsApiClient.AddEndPointToHearingAsync(hearing.Id, addEndpointRequest);
                        }
                        else
                        {
                            var existingEndpointToEdit = hearing.Endpoints.FirstOrDefault(e => e.Id.Equals(endpoint.Id));
                            if (existingEndpointToEdit != null && (existingEndpointToEdit.Display_name != endpoint.DisplayName ||
                                existingEndpointToEdit.Defence_advocate_id.ToString() != endpoint.DefenceAdvocateUsername))
                            {
                                _logger.LogDebug("Updating endpoint {endpoint} - {endpointDisplayName} in hearing {hearing}",
                                    existingEndpointToEdit.Id, existingEndpointToEdit.Display_name, hearingId);
                                var updateEndpointRequest = new UpdateEndpointRequest { Display_name = endpoint.DisplayName, Defence_advocate_username = endpoint.DefenceAdvocateUsername };
                                await _bookingsApiClient.UpdateDisplayNameForEndpointAsync(hearing.Id, endpoint.Id.Value, updateEndpointRequest);
                            }
                        }
                    }
                }
                var updatedHearing = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
                _logger.LogDebug("Attempting assign participants to the correct group");
                await AssignParticipantToCorrectGroups(updatedHearing, usernameAdIdDict);
                _logger.LogDebug("Successfully assigned participants to the correct group", updatedHearing.Id);
                return Ok(updatedHearing);
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e,
                    "Failed to edit hearing {hearing}. Status Code {StatusCode} - Message {Message}",
                    hearingId, e.StatusCode, e.Response);
                if (e.StatusCode == (int)HttpStatusCode.BadRequest)
                {
                    return BadRequest(e.Response);
                }
                if (e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    return NotFound(e.Response);
                }
                throw;
            }
        }

        private async Task AssignParticipantToCorrectGroups(HearingDetailsResponse hearing,
            Dictionary<string, string> newUsernameAdIdDict)
        {
            if (!newUsernameAdIdDict.Any())
            {
                return;
            }

            var tasks = (from pair in newUsernameAdIdDict
                         let participant = hearing.Participants.FirstOrDefault(x => x.Username == pair.Key)
                         select _userAccountService.AssignParticipantToGroup(pair.Value, participant.User_role_name)).ToList();
            await Task.WhenAll(tasks);
        }

        /// <summary>
        /// Gets bookings hearing by Id.
        /// </summary>
        /// <param name="hearingId">The unique sequential value of hearing ID.</param>
        /// <returns> The hearing</returns>
        [HttpGet("{hearingId}")]
        [SwaggerOperation(OperationId = "GetHearingById")]
        [ProducesResponseType(typeof(HearingDetailsResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public ActionResult GetHearingById(Guid hearingId)
        {
            try
            {
                var hearingResponse = _bookingsApiClient.GetHearingDetailsById(hearingId);
                return Ok(hearingResponse);
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.BadRequest)
                {
                    return BadRequest(e.Response);
                }

                throw;
            }
        }

        /// <summary>
        /// Get hearings by case number.
        /// </summary>
        /// <param name="caseNumber">The case number.</param>
        /// <param name="date">The date to filter by</param>
        /// <returns> The hearing</returns>
        [HttpGet("audiorecording/search")]
        [SwaggerOperation(OperationId = "SearchForAudioRecordedHearings")]
        [ProducesResponseType(typeof(List<HearingsForAudioFileSearchResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> SearchForAudioRecordedHearingsAsync([FromQuery]string caseNumber, [FromQuery] DateTime? date = null)
        {
            try
            {
                var decodedCaseNumber = string.IsNullOrWhiteSpace(caseNumber) ? null : WebUtility.UrlDecode(caseNumber);
                var hearingResponse = await _bookingsApiClient.SearchForHearingsAsync(decodedCaseNumber, date);

                return Ok(hearingResponse.Select(HearingsForAudioFileSearchMapper.MapFrom));
            }
            catch (BookingsApiException ex)
            {
                if (ex.StatusCode == (int)HttpStatusCode.BadRequest)
                {
                    return BadRequest(ex.Response);
                }

                throw;
            }
        }

        private UpdateHearingRequest MapHearingUpdateRequest(EditHearingRequest editHearingRequest)
        {
            var updateHearingRequest = new UpdateHearingRequest
            {
                Hearing_room_name = editHearingRequest.HearingRoomName,
                Hearing_venue_name = editHearingRequest.HearingVenueName,
                Other_information = editHearingRequest.OtherInformation,
                Scheduled_date_time = editHearingRequest.ScheduledDateTime,
                Scheduled_duration = editHearingRequest.ScheduledDuration,
                Updated_by = _userIdentity.GetUserIdentityName(),
                Cases = new List<CaseRequest>
                {
                    new CaseRequest
                    {
                            Name = editHearingRequest.Case.Name,
                            Number = editHearingRequest.Case.Number
                    }
                },
                Questionnaire_not_required = editHearingRequest.QuestionnaireNotRequired,
                Audio_recording_required = editHearingRequest.AudioRecordingRequired
            };
            return updateHearingRequest;
        }

        private UpdateParticipantRequest MapUpdateParticipantRequest(EditParticipantRequest participant)
        {
            var updateParticipantRequest = new UpdateParticipantRequest
            {
                Title = participant.Title,
                Display_name = participant.DisplayName,
                Organisation_name = participant.OrganisationName,
                Telephone_number = participant.TelephoneNumber,
                Representee = participant.Representee,
            };
            return updateParticipantRequest;
        }

        private ParticipantRequest MapNewParticipantRequest(EditParticipantRequest participant)
        {
            var newParticipant = new ParticipantRequest()
            {
                Case_role_name = participant.CaseRoleName,
                Contact_email = participant.ContactEmail,
                Display_name = participant.DisplayName,
                First_name = participant.FirstName,
                Last_name = participant.LastName,
                Hearing_role_name = participant.HearingRoleName,
                Middle_names = participant.MiddleNames,
                Representee = participant.Representee,
                Telephone_number = participant.TelephoneNumber,
                Title = participant.Title,
                Organisation_name = participant.OrganisationName,
            };
            return newParticipant;
        }

        /// <summary>
        ///     Update the hearing status.
        /// </summary>
        /// <param name="hearingId">The hearing id</param>
        /// <param name="updateBookingStatusRequest"></param>
        /// <returns>Success status</returns>
        [HttpPatch("{hearingId}")]
        [SwaggerOperation(OperationId = "UpdateBookingStatus")]
        [ProducesResponseType(typeof(UpdateBookingStatusResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> UpdateBookingStatus(Guid hearingId, UpdateBookingStatusRequest updateBookingStatusRequest)
        {
            var errorMessage = $"Failed to get the conference from video api, possibly the conference was not created or the kinly meeting room is null - hearingId: {hearingId}";

            try
            {
                updateBookingStatusRequest.Updated_by = _userIdentity.GetUserIdentityName();
                await _bookingsApiClient.UpdateBookingStatusAsync(hearingId, updateBookingStatusRequest);

                if (updateBookingStatusRequest.Status != BookingsAPI.Client.UpdateBookingStatus.Created)
                {
                    return Ok(new UpdateBookingStatusResponse { Success = true });
                }

                try
                {
                    var conferenceDetailsResponse = await _pollyRetryService.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
                    (
                        6, _ => TimeSpan.FromSeconds(5),
                        retryAttempt => _logger.LogWarning($"Failed to retrieve conference details from the VideoAPi for hearingId {hearingId}. Retrying attempt {retryAttempt}"),
                        videoApiResponseObject => !ConferenceExistsWithMeetingRoom(videoApiResponseObject),
                        () => _videoApiClient.GetConferenceByHearingRefIdAsync(hearingId)
                    );

                    if (ConferenceExistsWithMeetingRoom(conferenceDetailsResponse))
                    {
                        return Ok(new UpdateBookingStatusResponse { Success = true });
                    }
                }
                catch (VideoApiException ex)
                {
                    _logger.LogError(ex, $"{errorMessage}: {ex.Message}");
                }

                // Set the booking status to failed as the video api failed
                await _bookingsApiClient.UpdateBookingStatusAsync(hearingId, new UpdateBookingStatusRequest
                {
                    Status = BookingsAPI.Client.UpdateBookingStatus.Failed,
                    Updated_by = "System",
                    Cancel_reason = string.Empty
                });

                return Ok(new UpdateBookingStatusResponse { Success = false, Message = errorMessage });
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.BadRequest)
                {
                    return BadRequest(e.Response);
                }

                if (e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    return NotFound(e.Response);
                }

                throw;
            }
        }

        private static bool ConferenceExistsWithMeetingRoom(ConferenceDetailsResponse conference)
        {
            var success = !(conference?.Meeting_room == null
                            || string.IsNullOrWhiteSpace(conference.Meeting_room.Admin_uri)
                            || string.IsNullOrWhiteSpace(conference.Meeting_room.Participant_uri)
                            || string.IsNullOrWhiteSpace(conference.Meeting_room.Judge_uri)
                            || string.IsNullOrWhiteSpace(conference.Meeting_room.Pexip_node));
            return success;
        }
    }
}