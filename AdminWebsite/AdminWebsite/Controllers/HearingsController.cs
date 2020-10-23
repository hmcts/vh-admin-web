using AdminWebsite.Attributes;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Extensions;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using AdminWebsite.Mappers;
using AdminWebsite.VideoAPI.Client;
using Microsoft.Extensions.Logging;
using ParticipantRequest = AdminWebsite.BookingsAPI.Client.ParticipantRequest;
using UpdateParticipantRequest = AdminWebsite.BookingsAPI.Client.UpdateParticipantRequest;
using AddEndpointRequest = AdminWebsite.BookingsAPI.Client.AddEndpointRequest;
using UpdateEndpointRequest = AdminWebsite.BookingsAPI.Client.UpdateEndpointRequest;
using AdminWebsite.Helper;

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
        private readonly JavaScriptEncoder _encoder;
        private readonly IVideoApiClient _videoApiClient;
        private readonly IPollyRetryService _pollyRetryService;
        private readonly ILogger<HearingsController> _logger;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public HearingsController(IBookingsApiClient bookingsApiClient, IUserIdentity userIdentity,
            IUserAccountService userAccountService, IValidator<EditHearingRequest> editHearingRequestValidator,
            JavaScriptEncoder encoder, IVideoApiClient videoApiClient, IPollyRetryService pollyRetryService,
            ILogger<HearingsController> logger)
        {
            _bookingsApiClient = bookingsApiClient;
            _userIdentity = userIdentity;
            _userAccountService = userAccountService;
            _editHearingRequestValidator = editHearingRequestValidator;
            _encoder = encoder;
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
        [ProducesResponseType(typeof(HearingDetailsResponse), (int)HttpStatusCode.Created)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
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
                var hearingDetailsResponse = await _bookingsApiClient.BookNewHearingAsync(request);
                await AssignParticipantToCorrectGroups(hearingDetailsResponse, usernameAdIdDict);
                return Created("", hearingDetailsResponse);
            }
            catch (BookingsApiException e)
            {
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
            foreach (var participant in participants)
            {
                // set the participant username according to AD
                string adUserId;
                if(string.IsNullOrWhiteSpace(participant.Username))
                {
                    adUserId = await _userAccountService.UpdateParticipantUsername(participant);
                }
                else
                {
                    // get user
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

            var listOfDates = DateListMapper.GetListOfWorkingDates(hearingRequest.StartDate, hearingRequest.EndDate);
            if(listOfDates.Count == 0)
            {
                return BadRequest();
            }
            var cloneHearingRequest = new CloneHearingRequest { Dates = listOfDates };
            try
            {
                await _bookingsApiClient.CloneHearingAsync(hearingId, cloneHearingRequest);

                return NoContent();
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
                ModelState.AddModelError(nameof(hearingId), $"Please provide a valid {nameof(hearingId)}");
                return BadRequest(ModelState);
            }

            var result = _editHearingRequestValidator.Validate(request);

            if (!result.IsValid)
            {
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
                            var userId =  await _userAccountService.UpdateParticipantUsername(newParticipant);
                            usernameAdIdDict.Add(newParticipant.Username, userId);
                        }
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
                                var updateParticipantRequest = MapUpdateParticipantRequest(participant);
                                await _bookingsApiClient.UpdateParticipantDetailsAsync(hearingId, participant.Id.Value, updateParticipantRequest);
                            }
                            else if (existingParticipant.User_role_name == "Judge")
                            {
                                //Update Judge
                                var updateParticipantRequest = new UpdateParticipantRequest
                                {
                                    Display_name = participant.DisplayName
                                };
                                await _bookingsApiClient.UpdateParticipantDetailsAsync(hearingId, participant.Id.Value, updateParticipantRequest);
                            }
                        }
                    }
                }

                // Add new participants
                if (newParticipantList.Any())
                {
                    await _bookingsApiClient.AddParticipantsToHearingAsync(hearingId, new AddParticipantsToHearingRequest()
                    {
                        Participants = newParticipantList
                    });
                }

                // Delete existing participants if the request doesn't contain any update information
                if (hearing.Participants == null)
                { 
                    hearing.Participants = new List<ParticipantResponse>();
                }
                var deleteParticipantList = hearing.Participants.Where(p => request.Participants.All(rp => rp.ContactEmail != p.Contact_email));
                foreach (var participantToDelete in deleteParticipantList)
                {
                    await _bookingsApiClient.RemoveParticipantFromHearingAsync(hearingId, participantToDelete.Id);
                }

                // endpoints.
                if (hearing.Endpoints != null)
                {
                    var listOfEndpointsToDelete = hearing.Endpoints.Where(e => request.Endpoints.All(re => re.Id != e.Id));
                    foreach (var endpointToDelete in listOfEndpointsToDelete)
                    {
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
                            var addEndpointRequest = new AddEndpointRequest { Display_name = endpoint.DisplayName, Defence_advocate_username = endpoint.DefenceAdvocateUsername };
                            await _bookingsApiClient.AddEndPointToHearingAsync(hearing.Id, addEndpointRequest);
                        }
                        else
                        {
                            var existingEndpointToEdit = hearing.Endpoints.FirstOrDefault(e => e.Id.Equals(endpoint.Id));
                            if (existingEndpointToEdit != null && (existingEndpointToEdit.Display_name != endpoint.DisplayName || 
                                existingEndpointToEdit.Defence_advocate_id.ToString() != endpoint.DefenceAdvocateUsername))
                            {
                                var updateEndpointRequest = new UpdateEndpointRequest { Display_name = endpoint.DisplayName, Defence_advocate_username = endpoint.DefenceAdvocateUsername };
                                await _bookingsApiClient.UpdateDisplayNameForEndpointAsync(hearing.Id, endpoint.Id.Value, updateEndpointRequest);
                            }
                        }
                    }
                }
                var updatedHearing = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
                await AssignParticipantToCorrectGroups(updatedHearing, usernameAdIdDict);
                return Ok(updatedHearing);
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
                var decodedCaseNumber = string.IsNullOrWhiteSpace(caseNumber) ? null :  WebUtility.UrlDecode(caseNumber);
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

        /// <summary>
        /// Gets the all upcoming bookings hearing by the given case types for a hearing administrator.
        /// </summary>
        /// <param name="cursor">The unique sequential value of hearing ID.</param>
        /// <param name="limit">The max number of hearings to be returned.</param>
        /// <returns> The hearings list</returns>
        [HttpGet]
        [SwaggerOperation(OperationId = "GetBookingsList")]
        [ProducesResponseType(typeof(BookingsResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public ActionResult GetBookingsList(string cursor, int limit = 100)
        {
            if (cursor != null)
            {
                cursor = _encoder.Encode(cursor);
            }

            IEnumerable<string> caseTypes = null;

            if (_userIdentity.IsAdministratorRole())
            {
                caseTypes = _userIdentity.GetGroupDisplayNames();
            }
            else
            {
                return Unauthorized();
            }

            try
            {
                var types = caseTypes ?? Enumerable.Empty<string>();
                var hearingTypesIds = GetHearingTypesId(types);
                var bookingsResponse = _bookingsApiClient.GetHearingsByTypes(hearingTypesIds, cursor, limit);
                return Ok(bookingsResponse);
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


        private List<int> GetHearingTypesId(IEnumerable<string> caseTypes)
        {
            var typeIds = new List<int>();
            var types = _bookingsApiClient.GetCaseTypes();
            if (types != null && types.Any())
            {
                foreach (var item in caseTypes)
                {
                    var case_type = types.FirstOrDefault(s => s.Name == item);
                    if (case_type != null && !typeIds.Any(s => s == case_type.Id))
                    {
                        typeIds.Add(case_type.Id);
                    }
                }
            }

            return typeIds;
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
        [ProducesResponseType(typeof(UpdateBookingStatusResponse), (int) HttpStatusCode.OK)]
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
                    return Ok(new UpdateBookingStatusResponse {Success = true});
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
                        return Ok(new UpdateBookingStatusResponse {Success = true});
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

                return Ok(new UpdateBookingStatusResponse {Success = false, Message = errorMessage});
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode == (int) HttpStatusCode.BadRequest)
                {
                    return BadRequest(e.Response);
                }

                if (e.StatusCode == (int) HttpStatusCode.NotFound)
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