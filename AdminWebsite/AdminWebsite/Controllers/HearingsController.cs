using AdminWebsite.Attributes;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Extensions;
using AdminWebsite.Helper;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.Services.Models;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Newtonsoft.Json;
using AddEndpointRequest = AdminWebsite.BookingsAPI.Client.AddEndpointRequest;
using LinkedParticipantRequest = AdminWebsite.BookingsAPI.Client.LinkedParticipantRequest;
using ParticipantRequest = AdminWebsite.BookingsAPI.Client.ParticipantRequest;
using VideoApi.Client;

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
        private readonly ILogger<HearingsController> _logger;
        private readonly IHearingsService _hearingsService;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public HearingsController(IBookingsApiClient bookingsApiClient, IUserIdentity userIdentity,
            IUserAccountService userAccountService, IValidator<EditHearingRequest> editHearingRequestValidator,
            ILogger<HearingsController> logger, IHearingsService hearingsService)
        {
            _bookingsApiClient = bookingsApiClient;
            _userIdentity = userIdentity;
            _userAccountService = userAccountService;
            _editHearingRequestValidator = editHearingRequestValidator;
            _logger = logger;
            _hearingsService = hearingsService;
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
            var usernameAdIdDict = new Dictionary<string, User>();
            try
            {
                var nonJudgeParticipants = request.Participants.Where(p => p.Case_role_name != "Judge").ToList();
                await PopulateUserIdsAndUsernames(nonJudgeParticipants, usernameAdIdDict);

                if (request.Endpoints != null && request.Endpoints.Any())
                {
                    var endpointsWithDa = request.Endpoints
                        .Where(x => !string.IsNullOrWhiteSpace(x.Defence_advocate_username)).ToList();
                    _hearingsService.AssignEndpointDefenceAdvocates(endpointsWithDa, request.Participants.AsReadOnly());

                }

                request.Created_by = _userIdentity.GetUserIdentityName();
                
                _logger.LogDebug("BookNewHearing - Attempting to send booking request to Booking API");
                var hearingDetailsResponse = await _bookingsApiClient.BookNewHearingAsync(request);
                _logger.LogDebug("BookNewHearing - Successfully booked hearing {hearing}", hearingDetailsResponse.Id);
                
                _logger.LogDebug("BookNewHearing - Attempting assign participants to the correct group");
                await _hearingsService.AssignParticipantToCorrectGroups(hearingDetailsResponse, usernameAdIdDict);
                _logger.LogDebug("BookNewHearing - Successfully assigned participants to the correct group", hearingDetailsResponse.Id);

                _logger.LogDebug("BookNewHearing - Sending email notification to the participants");
                await _hearingsService.EmailParticipants(hearingDetailsResponse, usernameAdIdDict);
                _logger.LogDebug("BookNewHearing - Successfully sent emails to participants- {hearing}", hearingDetailsResponse.Id);

                return Created("", hearingDetailsResponse);
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e, "BookNewHearing - There was a problem saving the booking. Status Code {StatusCode} - Message {Message}", e.StatusCode, e.Response);
                if (e.StatusCode == (int) HttpStatusCode.BadRequest)
                {
                    return BadRequest(e.Response);
                }

                throw;
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"BookNewHearing - Failed to save hearing - Message: {e.Message} -  for request: {JsonConvert.SerializeObject(request)}");
                throw;
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
        public async Task<IActionResult> CloneHearing(Guid hearingId, MultiHearingRequest hearingRequest)
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
            var usernameAdIdDict = new Dictionary<string, User>();
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
                var updateHearingRequest = HearingUpdateRequestMapper.MapTo(request, _userIdentity.GetUserIdentityName());
                await _bookingsApiClient.UpdateHearingDetailsAsync(hearingId, updateHearingRequest);

                var newParticipantList = new List<ParticipantRequest>();

                foreach (var participant in request.Participants)
                {
                    if (!participant.Id.HasValue)
                    {
                        await _hearingsService.ProcessNewParticipants(hearingId, participant, hearing, usernameAdIdDict, newParticipantList);
                    }
                    else
                    {
                        await _hearingsService.ProcessExistingParticipants(hearingId, hearing, participant);
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

                await UpdateParticipantLinks(hearingId, request, hearing);

                // Add new participants
                await _hearingsService.SaveNewParticipants(hearingId, newParticipantList);

                // endpoints
                await _hearingsService.ProcessEndpoints(hearingId, request, hearing, newParticipantList);

                var updatedHearing = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
                _logger.LogDebug("Attempting assign participants to the correct group");
                await _hearingsService.AssignParticipantToCorrectGroups(updatedHearing, usernameAdIdDict);
                _logger.LogDebug("Successfully assigned participants to the correct group", updatedHearing.Id);

                // Send a notification email to newly created participants
                if (newParticipantList.Any())
                {
                    _logger.LogDebug("Sending email notification to the participants");
                    await _hearingsService.EmailParticipants(updatedHearing, usernameAdIdDict);
                    _logger.LogDebug("Successfully sent emails to participants- {hearing}", updatedHearing.Id);
                }
                
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
                    var conferenceDetailsResponse = await _hearingsService.GetConferenceDetailsByHearingIdWithRetry(hearingId, errorMessage);

                    if (!conferenceDetailsResponse.HasInvalidMeetingRoom())
                    {
                        return Ok(new UpdateBookingStatusResponse { Success = true, TelephoneConferenceId = conferenceDetailsResponse.MeetingRoom.TelephoneConferenceId });
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

        /// <summary>
        /// Gets for confirmed booking the telephone conference Id by hearing Id.
        /// </summary>
        /// <param name="hearingId">The unique sequential value of hearing ID.</param>
        /// <returns> The telephone conference Id</returns>
        [HttpGet("{hearingId}/telephoneConferenceId")]
        [SwaggerOperation(OperationId = "GetTelephoneConferenceIdById")]
        [ProducesResponseType(typeof(PhoneConferenceResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult> GetTelephoneConferenceIdById(Guid hearingId)
        {
            try
            {
                var conferenceDetailsResponse = await _hearingsService.GetConferenceDetailsByHearingId(hearingId);

                if (!conferenceDetailsResponse.HasInvalidMeetingRoom())
                {
                    return Ok(new PhoneConferenceResponse { TelephoneConferenceId = conferenceDetailsResponse.MeetingRoom.TelephoneConferenceId });
                }

                return NotFound();
            }
            catch (VideoApiException e)
            {  
                if(e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    return NotFound();
                }

                if (e.StatusCode == (int)HttpStatusCode.BadRequest)
                {
                    return BadRequest(e.Response);
                }

                throw;
            }
        }

        private async Task UpdateParticipantLinks(Guid hearingId, EditHearingRequest request, HearingDetailsResponse hearing)
        {
            if (request.Participants.Any(x => x.LinkedParticipants != null && x.LinkedParticipants.Count > 0))
            {
                foreach (var requestParticipant in request.Participants.Where(x => x.LinkedParticipants.Any()))
                {
                    var participant = hearing.Participants.First(x => x.Id == requestParticipant.Id);
                    var linkedParticipantsInRequest = request.Participants.First(x => x.Id == participant.Id)
                        .LinkedParticipants.ToList();

                    var requests = new List<LinkedParticipantRequest>();

                    foreach (var linkedParticipantInRequest in linkedParticipantsInRequest)
                    {
                        var linkedId = linkedParticipantInRequest.LinkedId;
                        var existingLink = false;

                        if (participant.Linked_participants != null)
                        {
                            existingLink = participant.Linked_participants.Exists(x => x.Linked_id == linkedId);
                        }

                        if (!existingLink)
                        {
                            var linkedParticipant =
                                hearing.Participants.First(x => x.Id == linkedParticipantInRequest.LinkedId);
                            requests.Add(new LinkedParticipantRequest
                            {
                                Participant_contact_email = participant.Contact_email,
                                Linked_participant_contact_email = linkedParticipant.Contact_email
                            });
                        }
                    }

                    var updateParticipantRequest = new UpdateParticipantRequest
                    {
                        Linked_participants = requests
                    };

                    await _bookingsApiClient.UpdateParticipantDetailsAsync(hearingId, participant.Id,
                        updateParticipantRequest);
                }
            }
        }
        
        private async Task PopulateUserIdsAndUsernames(IList<ParticipantRequest> participants,
            Dictionary<string, User> usernameAdIdDict)
        {
            _logger.LogDebug("Assigning HMCTS usernames for participants");
            foreach (var participant in participants)
            {
                // set the participant username according to AD
                User user;
                if (string.IsNullOrWhiteSpace(participant.Username))
                {
                    _logger.LogDebug("No username provided in booking for participant {email}. Checking AD by contact email",
                        participant.Contact_email);
                    user = await _userAccountService.UpdateParticipantUsername(participant);
                }
                else
                {
                    // get user
                    _logger.LogDebug(
                        "Username provided in booking for participant {email}. Getting id for username {username}",
                        participant.Contact_email, participant.Username);
                    var adUserId = await _userAccountService.GetAdUserIdForUsername(participant.Username);
                    user = new User { UserName = adUserId };
                }
                // username's participant will be set by this point
                usernameAdIdDict[participant.Username!] = user;
            }
        }
    }
}