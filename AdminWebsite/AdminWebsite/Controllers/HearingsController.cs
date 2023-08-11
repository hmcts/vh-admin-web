using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Attributes;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Extensions;
using AdminWebsite.Helper;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;
using HearingDetailsResponse = AdminWebsite.Contracts.Responses.HearingDetailsResponse;

namespace AdminWebsite.Controllers
{
    /// <summary>
    ///     Responsible for retrieving and storing hearing information
    /// </summary>
    [Produces("application/json")]
    [Route("api/hearings")]
    [ApiController]
    public class HearingsController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly IValidator<EditHearingRequest> _editHearingRequestValidator;
        private readonly IHearingsService _hearingsService;
        private readonly IConferenceDetailsService _conferenceDetailsService;
        private readonly IFeatureToggles _featureToggles;
        private readonly ILogger<HearingsController> _logger;
        private readonly IUserIdentity _userIdentity;
        private const int StartingSoonMinutesThreshold = 30;

        /// <summary>
        ///     Instantiates the controller
        /// </summary>
#pragma warning disable S107
        public HearingsController(IBookingsApiClient bookingsApiClient, 
            IUserIdentity userIdentity,
            IValidator<EditHearingRequest> editHearingRequestValidator,
            ILogger<HearingsController> logger, 
            IHearingsService hearingsService,
            IConferenceDetailsService conferenceDetailsService,
            IFeatureToggles featureToggles)
        {
            _bookingsApiClient = bookingsApiClient;
            _userIdentity = userIdentity;
            _editHearingRequestValidator = editHearingRequestValidator;
            _logger = logger;
            _hearingsService = hearingsService;
            _conferenceDetailsService = conferenceDetailsService;
            _featureToggles = featureToggles;
        }
#pragma warning restore S107
        /// <summary>
        ///     Create a hearing
        /// </summary>
        /// <param name="request">Hearing Request object</param>
        /// <returns>VideoHearingId</returns>
        [HttpPost]
        [SwaggerOperation(OperationId = "BookNewHearing")]
        [ProducesResponseType(typeof(HearingDetailsResponse), (int)HttpStatusCode.Created)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [HearingInputSanitizer]
        public async Task<ActionResult<HearingDetailsResponse>> Post([FromBody] BookHearingRequest request)
        {
            var newBookingRequest = request.BookingDetails;
            newBookingRequest.IsMultiDayHearing = request.IsMultiDay;
            try
            {
                if (newBookingRequest.Endpoints != null && newBookingRequest.Endpoints.Any())
                {
                    var endpointsWithDa = newBookingRequest.Endpoints
                        .Where(x => !string.IsNullOrWhiteSpace(x.DefenceAdvocateContactEmail))
                        .ToList();
                    _hearingsService.AssignEndpointDefenceAdvocates(endpointsWithDa, newBookingRequest.Participants.AsReadOnly());
                }

                newBookingRequest.CreatedBy = _userIdentity.GetUserIdentityName();
                _logger.LogInformation("BookNewHearing - Attempting to send booking request to Booking API");
                var hearingDetailsResponse = await _bookingsApiClient.BookNewHearingAsync(newBookingRequest);
                _logger.LogInformation("BookNewHearing - Successfully booked hearing {Hearing}", hearingDetailsResponse.Id);

                return Created("",hearingDetailsResponse.Map());
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e, "BookNewHearing - There was a problem saving the booking. Status Code {StatusCode} - Message {Message}",
                    e.StatusCode, e.Response);
                if (e.StatusCode == (int)HttpStatusCode.BadRequest) 
                    return BadRequest(e.Response);
                throw;
            }
            catch (Exception e)
            {
                _logger.LogError(e, "BookNewHearing - Failed to save hearing - {Message} -  for request: {RequestBody}",
                    e.Message, JsonConvert.SerializeObject(newBookingRequest));
                throw;
            }
        }

        /// <summary>
        /// Rebook an existing hearing with a booking status of Failed
        /// </summary>
        /// <param name="hearingId">Id of the hearing with a status of Failed</param>
        /// <returns></returns>
        [HttpPost("{hearingId}/conferences")]
        [SwaggerOperation(OperationId = "RebookHearing")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType(typeof(ValidationProblemDetails), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> RebookHearing(Guid hearingId)
        {
            try
            {
                await _bookingsApiClient.RebookHearingAsync(hearingId);
                
                return NoContent();
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e,
                    "There was a problem rebooking the hearing. Status Code {StatusCode} - Message {Message}",
                    e.StatusCode, e.Response);
                if (e.StatusCode == (int)HttpStatusCode.NotFound) return NotFound(e.Response);
                if (e.StatusCode == (int)HttpStatusCode.BadRequest) return BadRequest(e.Response);
                throw;
            }
        }

        /// <summary>
        ///     Clone hearings with the details of a given hearing on given dates
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
            _logger.LogDebug("Attempting to clone hearing {Hearing}", hearingId);

            var hearingDates = GetDatesForClonedHearings(hearingRequest);
            
            if (!hearingDates.Any())
            {
                _logger.LogWarning("No working dates provided to clone to");
                return BadRequest();
            }

            var cloneHearingRequest = new CloneHearingRequest { Dates = hearingDates };

            try
            {
                _logger.LogDebug("Sending request to clone hearing to Bookings API");
                await _bookingsApiClient.CloneHearingAsync(hearingId, cloneHearingRequest);
                _logger.LogDebug("Successfully cloned hearing {Hearing}", hearingId);

                var groupedHearings = await _bookingsApiClient.GetHearingsByGroupIdAsync(hearingId);

                var conferenceStatusToGet = groupedHearings.Where(x => x.Participants?.Any(x => x.HearingRoleName == RoleNames.Judge) ?? false);
                var tasks = conferenceStatusToGet.Select(x => GetHearingConferenceStatus(x.Id)).ToList();
                await Task.WhenAll(tasks);
                
                return NoContent();
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e,
                    "There was a problem cloning the booking. Status Code {StatusCode} - Message {Message}",
                    e.StatusCode, e.Response);
                if (e.StatusCode == (int)HttpStatusCode.BadRequest) return BadRequest(e.Response);
                throw;
            }
        }

        private static List<DateTime> GetDatesForClonedHearings(MultiHearingRequest hearingRequest)
        {
            if (hearingRequest.HearingDates != null && hearingRequest.HearingDates.Any())
            {
                return hearingRequest.HearingDates.Skip(1).ToList();
            }
            
            if (DateListMapper.IsWeekend(hearingRequest.StartDate) || DateListMapper.IsWeekend(hearingRequest.EndDate))
            {
                return DateListMapper.GetListOfDates(hearingRequest.StartDate, hearingRequest.EndDate);
            }
            
            return DateListMapper.GetListOfWorkingDates(hearingRequest.StartDate, hearingRequest.EndDate);
        }

        /// <summary>
        ///     Edit a hearing
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
            if (hearingId == Guid.Empty)
            {
                _logger.LogWarning("No hearing id found to edit");
                ModelState.AddModelError(nameof(hearingId), $"Please provide a valid {nameof(hearingId)}");
                return BadRequest(ModelState);
            }

            _logger.LogDebug("Attempting to edit hearing {Hearing}", hearingId);
            var result = _editHearingRequestValidator.Validate(request);
            if (!result.IsValid)
            {
                _logger.LogWarning("Failed edit hearing validation");
                ModelState.AddFluentValidationErrors(result.Errors);
                return BadRequest(ModelState);
            }

            HearingDetailsResponse originalHearing;
            try
            {

                if (_featureToggles.ReferenceDataToggle())
                {
                    var response = await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId);
                    originalHearing = response.Map();
                }
                else
                {
                    
                    var response = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
                    originalHearing = response.Map();
                }
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e, "Failed to get hearing {Hearing}. Status Code {StatusCode} - Message {Message}",
                    hearingId, e.StatusCode, e.Response);
                if (e.StatusCode != (int)HttpStatusCode.NotFound) throw;
                return NotFound($"No hearing with id found [{hearingId}]");
            }
            try
            {
                if (IsHearingStartingSoon(originalHearing) && originalHearing.Status == BookingStatus.Created &&
                    !_hearingsService.IsAddingParticipantOnly(request, originalHearing) &&
                    !_hearingsService.IsUpdatingJudge(request, originalHearing) &&
                    !_hearingsService.HasEndpointsBeenChanged(request, originalHearing))
                {
                    var errorMessage =
                        $"You can't edit a confirmed hearing [{hearingId}] within {StartingSoonMinutesThreshold} minutes of it starting";
                    _logger.LogWarning(errorMessage);
                    ModelState.AddModelError(nameof(hearingId), errorMessage);
                    return BadRequest(ModelState);
                }

                var judgeExistsInRequest = request?.Participants?.Any(p => p.HearingRoleName == RoleNames.Judge) ?? false;
                if (originalHearing.Status == BookingStatus.Created && !judgeExistsInRequest)
                {
                    const string errorMessage = "You can't edit a confirmed hearing if the update removes the judge";
                    _logger.LogWarning(errorMessage);
                    ModelState.AddModelError(nameof(hearingId), errorMessage);
                    return BadRequest(ModelState);
                }
                HearingDetailsResponse updatedHearing;
                if (_featureToggles.ReferenceDataToggle())
                {
                    var updatedHearing2 = await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId);
                    updatedHearing = updatedHearing2.Map();
                }
                else
                {
                    var updatedHearing1 = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
                    updatedHearing = updatedHearing1.Map();
                }

                //Save hearing details
                var updateHearingRequest = HearingUpdateRequestMapper.MapTo(request, _userIdentity.GetUserIdentityName());
                await _bookingsApiClient.UpdateHearingDetailsAsync(hearingId, updateHearingRequest);
                await UpdateParticipants(hearingId, request, originalHearing);
                
                if (updatedHearing.Status == BookingStatus.Failed) return Ok(updatedHearing);
                if (!updatedHearing.HasScheduleAmended(originalHearing)) return Ok(updatedHearing);
                return Ok(updatedHearing);
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e, "Failed to edit hearing {Hearing}. Status Code {StatusCode} - Message {Message}",
                    hearingId, e.StatusCode, e.Response);
                if (e.StatusCode == (int)HttpStatusCode.BadRequest) return BadRequest(e.Response);
                throw;
            }
        }

        private async Task UpdateParticipants(Guid hearingId, EditHearingRequest request, HearingDetailsResponse originalHearing)
        {
            var existingParticipants = new List<UpdateParticipantRequest>();
            var newParticipants = new List<ParticipantRequest>();
            var removedParticipantIds = originalHearing.Participants.Where(p => request.Participants.All(rp => rp.Id != p.Id))
                .Select(x => x.Id).ToList();

            foreach (var participant in request.Participants)
                if (participant.Id.HasValue)
                    ExtractExistingParticipants(originalHearing, participant, existingParticipants);
                else if (await _hearingsService.ProcessNewParticipant(hearingId, participant, removedParticipantIds, originalHearing) is { } newParticipant)
                    newParticipants.Add(newParticipant);
            
            var linkedParticipants = ExtractLinkedParticipants(request, originalHearing, removedParticipantIds, existingParticipants, newParticipants);
            
            await _hearingsService.ProcessParticipants(hearingId, existingParticipants, newParticipants, removedParticipantIds.ToList(), linkedParticipants.ToList());
            await _hearingsService.ProcessEndpoints(hearingId, request, originalHearing, newParticipants);
        }

        private static List<LinkedParticipantRequest> ExtractLinkedParticipants(
            EditHearingRequest request, 
            HearingDetailsResponse originalHearing,
            List<Guid> removedParticipantIds, 
            List<UpdateParticipantRequest> existingParticipants, 
            List<ParticipantRequest> newParticipants)
        {
            var linkedParticipants = new List<LinkedParticipantRequest>();
            var participantsWithLinks = request.Participants
                .Where(x => x.LinkedParticipants.Any() &&
                            !removedParticipantIds.Contains(x.LinkedParticipants[0].LinkedId) &&
                            !removedParticipantIds.Contains(x.LinkedParticipants[0].ParticipantId))
                .ToList();

            for (int i = 0; i < participantsWithLinks.Count; i++)
            {
                var participantWithLinks = participantsWithLinks[i];
                var linkedParticipantRequest = new LinkedParticipantRequest
                {
                    LinkedParticipantContactEmail = participantWithLinks.LinkedParticipants[0].LinkedParticipantContactEmail,
                    ParticipantContactEmail = participantWithLinks.LinkedParticipants[0].ParticipantContactEmail ??
                                              participantWithLinks.ContactEmail,
                    Type = participantWithLinks.LinkedParticipants[0].Type
                };

                // If the participant link is not new and already existed, then the ParticipantContactEmail will be null. We find it here and populate it.
                // We also remove the participant this one is linked to, to avoid duplicating entries.
                if (participantWithLinks.Id.HasValue &&
                    existingParticipants.SingleOrDefault(x => x.ParticipantId == participantWithLinks.Id) != null)
                {
                    // Is the linked participant an existing participant?
                    var secondaryParticipantInLinkContactEmail = originalHearing.Participants
                        .SingleOrDefault(x => x.Id == participantWithLinks.LinkedParticipants[0].LinkedId)?
                        .ContactEmail ?? newParticipants
                        .SingleOrDefault(x =>
                            x.ContactEmail == participantWithLinks.LinkedParticipants[0].LinkedParticipantContactEmail)?
                        .ContactEmail;

                    // If the linked participant isn't an existing participant it will be a newly added participant                        
                    linkedParticipantRequest.LinkedParticipantContactEmail = secondaryParticipantInLinkContactEmail;

                    // If the linked participant is an already existing user they will be mapped twice, so we remove them here.
                    var secondaryParticipantInLinkIndex = participantsWithLinks
                        .FindIndex(x => x.ContactEmail == secondaryParticipantInLinkContactEmail);
                    if (secondaryParticipantInLinkIndex >= 0)
                        participantsWithLinks.RemoveAt(secondaryParticipantInLinkIndex);
                }

                linkedParticipants.Add(linkedParticipantRequest);
            }
            return linkedParticipants;
        }

        private static void ExtractExistingParticipants(
            HearingDetailsResponse originalHearing,
            EditParticipantRequest participant, 
            List<UpdateParticipantRequest> existingParticipants)
        {
            var existingParticipant = originalHearing.Participants.FirstOrDefault(p => p.Id.Equals(participant.Id));
            if (existingParticipant == null || string.IsNullOrEmpty(existingParticipant.UserRoleName))
                return;
            
            var updateParticipantRequest = UpdateParticipantRequestMapper.MapTo(participant);
            existingParticipants.Add(updateParticipantRequest);
        }

        private static bool IsHearingStartingSoon(HearingDetailsResponse originalHearing)
        {
            var timeToCheckHearingAgainst = DateTime.UtcNow.AddMinutes(StartingSoonMinutesThreshold);
            return originalHearing.ScheduledDateTime < timeToCheckHearingAgainst;
        }

        /// <summary>
        ///     Gets bookings hearing by Id.
        /// </summary>
        /// <param name="hearingId">The unique sequential value of hearing ID.</param>
        /// <returns> The hearing</returns>
        [HttpGet("{hearingId}")]
        [SwaggerOperation(OperationId = "GetHearingById")]
        [ProducesResponseType(typeof(HearingDetailsResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult> GetHearingById(Guid hearingId)
        {
            try
            {
                HearingDetailsResponse hearingResponse;
                if (_featureToggles.ReferenceDataToggle())
                {
                    var response = await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId);
                    hearingResponse = response.Map();
                }
                else
                {
                    var response = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
                    hearingResponse = response.Map();
                }
                return Ok(hearingResponse);
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.BadRequest) return BadRequest(e.Response);
                throw;
            }
        }

        /// <summary>
        ///     Get hearings by case number.
        /// </summary>
        /// <param name="caseNumber">The case number.</param>
        /// <param name="date">The date to filter by</param>
        /// <returns> The hearing</returns>
        [HttpGet("audiorecording/search")]
        [SwaggerOperation(OperationId = "SearchForAudioRecordedHearings")]
        [ProducesResponseType(typeof(List<HearingsForAudioFileSearchResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> SearchForAudioRecordedHearingsAsync([FromQuery] string caseNumber,
            [FromQuery] DateTime? date = null)
        {
            try
            {
                var decodedCaseNumber = string.IsNullOrWhiteSpace(caseNumber) ? null : WebUtility.UrlDecode(caseNumber);
                var hearingResponse = await _bookingsApiClient.SearchForHearingsAsync(decodedCaseNumber, date);
                return Ok(hearingResponse.Select(HearingsForAudioFileSearchMapper.MapFrom));
            }
            catch (BookingsApiException ex)
            {
                if (ex.StatusCode == (int)HttpStatusCode.BadRequest) return BadRequest(ex.Response);
                throw;
            }
        }

        /// <summary>
        ///     Get the conference status.
        /// </summary>
        /// <param name="hearingId">The hearing id</param>
        /// <returns>Success status</returns>
        [HttpGet("{hearingId}/conference-status")]
        [SwaggerOperation(OperationId = "GetHearingConferenceStatus")]
        [ProducesResponseType(typeof(UpdateBookingStatusResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> GetHearingConferenceStatus(Guid hearingId)
        {
            var errorMessage = $"Failed to get the booking created status, possibly the conference was not created - hearingId: {hearingId}";
            try
            {
                _logger.LogDebug($"Hearing {hearingId} is booked. Polling for the status in BookingsApi");

                VideoApi.Contract.Responses.ConferenceDetailsResponse conferenceDetailsResponse;
                var response = await _bookingsApiClient.GetBookingStatusByIdAsync(hearingId);

                if ((BookingStatus)response == BookingStatus.Created)
                {
                    try
                    {
                        conferenceDetailsResponse = await _conferenceDetailsService.GetConferenceDetailsByHearingId(hearingId);
                        if (!conferenceDetailsResponse.HasValidMeetingRoom())
                        {
                            return Ok(new UpdateBookingStatusResponse { Success = false, Message = errorMessage });
                        }
                    }
                    catch(VideoApiException e)
                    {
                        _logger.LogError(e, "Failed to confirm a hearing. {ErrorMessage}", errorMessage);
                        if (e.StatusCode == (int)HttpStatusCode.NotFound)
                        {
                            return Ok(new UpdateBookingStatusResponse { Success = false, Message = errorMessage });
                        }

                        return BadRequest(e.Response);
                    }
                    return Ok(new UpdateBookingStatusResponse
                    {
                        Success = true,
                        TelephoneConferenceId = conferenceDetailsResponse.MeetingRoom.TelephoneConferenceId
                    });
                }
                else
                {
                    return Ok(new UpdateBookingStatusResponse { Success = false, Message = errorMessage });
                }
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e, "Failed to confirm a hearing. {ErrorMessage}", errorMessage);
                if (e.StatusCode == (int)HttpStatusCode.NotFound)
                    return Ok(new UpdateBookingStatusResponse { Success = false, Message = errorMessage });
                
                return BadRequest(e.Response);
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
        public async Task<IActionResult> UpdateBookingStatus(Guid hearingId,
            UpdateBookingStatusRequest updateBookingStatusRequest)
        {
            try
            {
                var hearing = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
                var judgeExists = hearing?.Participants?.Any(p => p.HearingRoleName == RoleNames.Judge) ?? false;
                if (!judgeExists && updateBookingStatusRequest.Status == BookingsApi.Contract.V1.Requests.Enums.UpdateBookingStatus.Created)
                    return BadRequest("This hearing has no judge");

                _logger.LogDebug("Attempting to update hearing {Hearing} to booking status {BookingStatus}", hearingId, updateBookingStatusRequest.Status);

                updateBookingStatusRequest.UpdatedBy = _userIdentity.GetUserIdentityName();
                await _bookingsApiClient.UpdateBookingStatusAsync(hearingId, updateBookingStatusRequest);

                _logger.LogDebug("Updated hearing {Hearing} to booking status {BookingStatus}", hearingId, updateBookingStatusRequest.Status);
                return Ok(new UpdateBookingStatusResponse { Success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "There was an unknown error updating status for hearing {Hearing}", hearingId);
                if (ex is BookingsApiException)
                {
                    var e = ex as BookingsApiException;
                    if (e.StatusCode == (int)HttpStatusCode.BadRequest) return BadRequest(e.Response);
                    if (e.StatusCode == (int)HttpStatusCode.NotFound) return NotFound(e.Response);
                    return BadRequest(e);
                }
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        ///     Update the failed hearing status.
        /// </summary>
        /// <param name="hearingId">The hearing id</param>
        /// <returns>Success status</returns>
        [HttpPut("{hearingId}/failed-status")]
        [SwaggerOperation(OperationId = "UpdateFailedBookingStatus")]
        [ProducesResponseType(typeof(UpdateBookingStatusResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> UpdateHearingStatus(Guid hearingId)
        {
            var errorMessage = $"Failed to update the failed status for a hearing - hearingId: {hearingId}";
            try
            {
                await _hearingsService.UpdateFailedBookingStatus(hearingId);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, errorMessage);
                if (e.StatusCode == (int) HttpStatusCode.NotFound) return NotFound();
                if (e.StatusCode == (int) HttpStatusCode.BadRequest) return BadRequest(e.Response);
            }
            return Ok(new UpdateBookingStatusResponse { Success = true, Message = $"Status updated for hearing: {hearingId}" });
        }

        /// <summary>
        ///     Gets for confirmed booking the telephone conference Id by hearing Id.
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
                var conferenceDetailsResponse = await _conferenceDetailsService.GetConferenceDetailsByHearingId(hearingId, true);

                if (conferenceDetailsResponse.HasValidMeetingRoom())
                    return Ok(new PhoneConferenceResponse
                    {
                        TelephoneConferenceId = conferenceDetailsResponse.MeetingRoom.TelephoneConferenceId
                    });
                return NotFound();
            }
            catch (VideoApiException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.NotFound) return NotFound();
                if (e.StatusCode == (int)HttpStatusCode.BadRequest) return BadRequest(e.Response);
                throw;
            }
        }
    }
}