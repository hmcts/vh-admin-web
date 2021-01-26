using AdminWebsite.Attributes;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Extensions;
using AdminWebsite.Helper;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.Services.Models;
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
using Newtonsoft.Json;
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
        private readonly IHearingsService _hearingsService;
        private readonly ILogger<HearingsController> _logger;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public HearingsController(IBookingsApiClient bookingsApiClient, IUserIdentity userIdentity,
            IUserAccountService userAccountService, IValidator<EditHearingRequest> editHearingRequestValidator,
            IVideoApiClient videoApiClient, IHearingsService hearingsService, ILogger<HearingsController> logger)
        {
            _bookingsApiClient = bookingsApiClient;
            _userIdentity = userIdentity;
            _userAccountService = userAccountService;
            _editHearingRequestValidator = editHearingRequestValidator;
            _videoApiClient = videoApiClient;
            _hearingsService = hearingsService;
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
            var usernameAdIdDict = new Dictionary<string, User>();
            try
            {
                var nonJudgeParticipants = request.Participants.Where(p => p.Case_role_name != "Judge").ToList();
                await _hearingsService.PopulateUserIdsAndUsernames(nonJudgeParticipants, usernameAdIdDict);

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
                var updateHearingRequest = _hearingsService.MapHearingUpdateRequest(request, _userIdentity.GetUserIdentityName());
                await _bookingsApiClient.UpdateHearingDetailsAsync(hearingId, updateHearingRequest);

                var newParticipantList = new List<ParticipantRequest>();

                foreach (var participant in request.Participants)
                {
                    if (!participant.Id.HasValue)
                    {
                        // Add a new participant
                        // Map the request except the username
                        var newParticipant = _hearingsService.MapNewParticipantRequest(participant);
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
                            var user = await _userAccountService.UpdateParticipantUsername(newParticipant);
                            usernameAdIdDict.Add(newParticipant.Username, user);
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
                                var updateParticipantRequest = _hearingsService.MapUpdateParticipantRequest(participant);
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

                var response = await _hearingsService.UpdateBookingReference(hearingId, errorMessage);
                if (response.Successful)
                {
                    return Ok(new UpdateBookingStatusResponse { Success = true, TelephoneConferenceId = response.UpdateResponse.Meeting_room.Telephone_conference_id });
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
                var conferenceDetailsResponse = await _videoApiClient.GetConferenceByHearingRefIdAsync(hearingId);

                if (_hearingsService.ConferenceExistsWithMeetingRoom(conferenceDetailsResponse))
                {
                    return Ok(new PhoneConferenceResponse { TelephoneConferenceId = conferenceDetailsResponse.Meeting_room.Telephone_conference_id });
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
    }
}