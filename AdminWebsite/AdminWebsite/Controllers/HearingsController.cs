using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Attributes;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Extensions;
using AdminWebsite.Helper;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using BookingsApi.Client;
using BookingsApi.Contract.Interfaces.Requests;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Requests.Enums;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Requests.Enums;
using BookingsApi.Contract.V2.Responses;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;
using HearingDetailsResponse = AdminWebsite.Contracts.Responses.HearingDetailsResponse;
using JudiciaryParticipantRequest = AdminWebsite.Contracts.Requests.JudiciaryParticipantRequest;
using LinkedParticipantRequest = AdminWebsite.Contracts.Requests.LinkedParticipantRequest;
using ParticipantRequest = BookingsApi.Contract.V1.Requests.ParticipantRequest;

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
        [ProducesResponseType(typeof(ValidationProblemDetails),(int)HttpStatusCode.BadRequest)]
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

                var response = await BookNewHearing(newBookingRequest);
                
                return Created("", response);
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e, "BookNewHearing - There was a problem saving the booking. Status Code {StatusCode} - Message {Message}",
                    e.StatusCode, e.Response);
                if (e.StatusCode == (int)HttpStatusCode.BadRequest)
                {
                    var typedException = e as BookingsApiException<ValidationProblemDetails>;
                    return ValidationProblem(typedException!.Result);
                }
                return StatusCode(500, e.Message);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "BookNewHearing - Failed to save hearing - {Message} -  for request: {RequestBody}",
                    e.Message, JsonConvert.SerializeObject(newBookingRequest));
                return StatusCode(500, e.Message);
            }
        }

        private async Task<object> BookNewHearing(BookingDetailsRequest newBookingRequest)
        {
            object response;
            Guid hearingId;
                
            _logger.LogInformation("BookNewHearing - Attempting to send booking request to Booking API");
            
            if (_featureToggles.UseV2Api())
            {
                var newBookingRequestV2 = newBookingRequest.MapToV2();
                    
                var hearingDetailsResponse = await _bookingsApiClient.BookNewHearingWithCodeAsync(newBookingRequestV2);

                hearingId = hearingDetailsResponse.Id;
                    
                response = hearingDetailsResponse.Map();
            }
            else
            {
                var newBookingRequestV1 = newBookingRequest.MapToV1();

                var hearingDetailsResponse = await _bookingsApiClient.BookNewHearingAsync(newBookingRequestV1);
                    
                hearingId = hearingDetailsResponse.Id;
                    
                response = hearingDetailsResponse.Map();
            }

            _logger.LogInformation("BookNewHearing - Successfully booked hearing {Hearing}", hearingId);

            return response;
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
                return StatusCode(500, e.Message);
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

            var cloneHearingRequest = new CloneHearingRequest
            {
                Dates = hearingDates, 
                ScheduledDuration = hearingRequest.ScheduledDuration
            };

            try
            {
                _logger.LogDebug("Sending request to clone hearing to Bookings API");
                await _bookingsApiClient.CloneHearingAsync(hearingId, cloneHearingRequest);
                _logger.LogDebug("Successfully cloned hearing {Hearing}", hearingId);

                var groupedHearings = await _bookingsApiClient.GetHearingsByGroupIdAsync(hearingId);

                var conferenceStatusToGet = groupedHearings.Where(x => x.Participants?
                    .Exists(x => x.HearingRoleName == RoleNames.Judge) ?? false);
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
                return StatusCode(500, e.Message);
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
        [ProducesResponseType(typeof(ValidationProblemDetails),(int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [HearingInputSanitizer]
        public async Task<ActionResult<HearingDetailsResponse>> EditHearing(Guid hearingId, [FromBody] EditHearingRequest request)
        {
            if (hearingId == Guid.Empty)
            {
                _logger.LogWarning("No hearing id found to edit");
                ModelState.AddModelError(nameof(hearingId), $"Please provide a valid {nameof(hearingId)}");
                return ValidationProblem(ModelState);
            }

            _logger.LogDebug("Attempting to edit hearing {Hearing}", hearingId);
            var result = _editHearingRequestValidator.Validate(request);
            if (!result.IsValid)
            {
                _logger.LogWarning("Failed edit hearing validation");
                ModelState.AddFluentValidationErrors(result.Errors);
                return ValidationProblem(ModelState);
            }

            HearingDetailsResponse originalHearing;
            try
            {
                originalHearing = await GetHearing(hearingId);
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
                var updatedHearing = await MapHearingToUpdate(hearingId);

                await UpdateHearing(request, hearingId, updatedHearing);

                if (updatedHearing.Status == BookingStatus.Failed) return Ok(updatedHearing);
                if (!updatedHearing.HasScheduleAmended(originalHearing)) return Ok(updatedHearing);
                return Ok(updatedHearing);
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e, "Failed to edit hearing {Hearing}. Status Code {StatusCode} - Message {Message}",
                    hearingId, e.StatusCode, e.Response);
                
                if (e.StatusCode is (int)HttpStatusCode.BadRequest)
                {
                    var typedException = e as BookingsApiException<ValidationProblemDetails>;
                    return ValidationProblem(typedException!.Result);
                }
                
                return StatusCode(500, e.Message);
            }
        }

        /// <summary>
        ///     Edit a multi-day hearing
        /// </summary>
        /// <param name="hearingId">The id of the hearing</param>
        /// <param name="request">Hearing Request object for edit operation</param>
        /// <returns></returns>
        [HttpPut("{hearingId}/multi-day")]
        [SwaggerOperation(OperationId = "EditMultiDayHearing")]
        [ProducesResponseType(typeof(HearingDetailsResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType(typeof(ValidationProblemDetails),(int)HttpStatusCode.BadRequest)]
        [HearingInputSanitizer]
        public async Task<ActionResult<HearingDetailsResponse>> EditMultiDayHearing(Guid hearingId, EditMultiDayHearingRequest request)
        {
            try
            {
                var hearing = await GetHearing(hearingId);

                if (hearing.GroupId == null)
                {
                    ModelState.AddModelError(nameof(hearingId), $"Hearing is not multi-day");
                    return ValidationProblem(ModelState);
                }

                await UpdateMultiDayHearing(request, hearing.Id, hearing.GroupId.Value);

                var updatedHearing = await MapHearingToUpdate(hearingId);
            
                return Ok(updatedHearing);
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode is (int)HttpStatusCode.NotFound)
                {
                    var typedException = e as BookingsApiException<string>;
                    return NotFound(typedException!.Result);
                }
                
                if (e.StatusCode is (int)HttpStatusCode.BadRequest)
                {
                    var typedException = e as BookingsApiException<ValidationProblemDetails>;
                    return ValidationProblem(typedException!.Result);
                }

                _logger.LogError(e, "Unexpected error trying to edit multi day hearing");
                return StatusCode(500, e.Message);
            }
        }

        [HttpPatch("{hearingId}/multi-day/cancel")]
        [SwaggerOperation(OperationId = "CancelMultiDayHearing")]
        [ProducesResponseType(typeof(UpdateBookingStatusResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> CancelMultiDayHearing(Guid hearingId, CancelMultiDayHearingRequest request)
        {
            try
            {
                var hearing = await GetHearing(hearingId);

                if (hearing.GroupId == null)
                {
                    ModelState.AddModelError(nameof(hearingId), $"Hearing is not multi-day");
                    return ValidationProblem(ModelState);
                }

                await CancelMultiDayHearing(request, hearing.Id, hearing.GroupId.Value);
                
                return Ok(new UpdateBookingStatusResponse { Success = true });
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode is (int)HttpStatusCode.NotFound)
                {
                    var typedException = e as BookingsApiException<string>;
                    return NotFound(typedException!.Result);
                }
                
                if (e.StatusCode is (int)HttpStatusCode.BadRequest)
                {
                    var typedException = e as BookingsApiException<ValidationProblemDetails>;
                    return ValidationProblem(typedException!.Result);
                }
                
                _logger.LogError(e, "Unexpected error trying to cancel multi day hearing");
                return StatusCode(500, e.Message);
            }
        }

        private async Task<HearingDetailsResponse> GetHearing(Guid hearingId)
        {
            if (_featureToggles.UseV2Api())
            {
                var responseV2 = await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId);
                return responseV2.Map();
            }

            var responseV1 = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
            return responseV1.Map();
        }

        private async Task<HearingDetailsResponse> MapHearingToUpdate(Guid hearingId)
        {
            if (_featureToggles.UseV2Api())
            {
                var updatedHearing2 = await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId);
                return updatedHearing2.Map();
            }
            
            var updatedHearing1 = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
            return updatedHearing1.Map();
        }

        private async Task UpdateHearing(EditHearingRequest request, Guid hearingId, HearingDetailsResponse originalHearing)
        {
            //Save hearing details
            if (_featureToggles.UseV2Api())
            {
                var updateHearingRequestV2 = HearingUpdateRequestMapper.MapToV2(request, _userIdentity.GetUserIdentityName());
                await _bookingsApiClient.UpdateHearingDetails2Async(hearingId, updateHearingRequestV2);
                await UpdateParticipantsV2(hearingId, request.Participants, request.Endpoints, originalHearing);
                await UpdateJudiciaryParticipants(hearingId, request.JudiciaryParticipants, originalHearing);
            }
            else
            {
                var updateHearingRequestV1 = HearingUpdateRequestMapper.MapToV1(request, _userIdentity.GetUserIdentityName());
                await _bookingsApiClient.UpdateHearingDetailsAsync(hearingId, updateHearingRequestV1);
                await UpdateParticipantsV1(hearingId, request.Participants, request.Endpoints, originalHearing);
            }
        }

        private async Task UpdateMultiDayHearing(EditMultiDayHearingRequest request, Guid hearingId, Guid groupId)
        {
            var hearingsInMultiDay = await _bookingsApiClient.GetHearingsByGroupIdAsync(groupId);
            var thisHearing = hearingsInMultiDay.First(x => x.Id == hearingId);
            
            var hearingsToUpdate = new List<BookingsApi.Contract.V1.Responses.HearingDetailsResponse>
            {
                thisHearing
            };
            
            if (request.UpdateFutureDays)
            {
                var futureHearings = hearingsInMultiDay.Where(x => x.ScheduledDateTime.Date > thisHearing.ScheduledDateTime.Date);
                hearingsToUpdate.AddRange(futureHearings);
            }
            
            hearingsToUpdate = hearingsToUpdate
                .Where(h => 
                    h.Status != BookingsApi.Contract.V1.Enums.BookingStatus.Cancelled && 
                    h.Status != BookingsApi.Contract.V1.Enums.BookingStatus.Failed)
                .ToList();

            if (_featureToggles.UseV2Api())
            {
                await UpdateMultiDayHearingV2();
            }
            else
            {
                await UpdateMultiDayHearingV1();
            }

            async Task UpdateMultiDayHearingV1()
            {
                var bookingsApiRequest = new UpdateHearingsInGroupRequest
                {
                    UpdatedBy = _userIdentity.GetUserIdentityName()
                };

                // Work out which fields have changed relative to the day that we are editing
                var scheduledDurationChanged = false;
                var hearingVenueNameChanged = false;
                var hearingRoomNameChanged = false;
                var otherInformationChanged = false;
                var caseNumberChanged = false;
                var audioRecordingRequiredChanged = false;

                var participantsForEditedHearing = new UpdateHearingParticipantsRequest();
                var endpointsForEditedHearing = new UpdateHearingEndpointsRequest();
                var participantChanges = new List<ParticipantChanges>();
                var participantsRemovedForEditedHearing = new List<ParticipantResponse>();
                var linkedParticipantChanges = new LinkedParticipantChanges();
                
                foreach (var hearing in hearingsToUpdate)
                {
                    if (hearing.Id == hearingId)
                    {
                        if (request.ScheduledDuration != hearing.ScheduledDuration)
                        {
                            scheduledDurationChanged = true;
                        }

                        if (request.HearingVenueName != hearing.HearingVenueName)
                        {
                            hearingVenueNameChanged = true;
                        }

                        if (request.HearingRoomName != hearing.HearingRoomName)
                        {
                            hearingRoomNameChanged = true;
                        }

                        if (request.OtherInformation != hearing.OtherInformation)
                        {
                            otherInformationChanged = true;
                        }

                        if (request.CaseNumber != hearing.Cases[0].Number)
                        {
                            caseNumberChanged = true;
                        }

                        if (request.AudioRecordingRequired != hearing.AudioRecordingRequired)
                        {
                            audioRecordingRequiredChanged = true;
                        }
                        
                        var participantsInRequest = request.Participants.ToList();
                        
                        // Existing participants
                        var existingParticipantsInEditedHearing = hearing.Participants.ToList();
                        foreach (var participantInRequest in participantsInRequest)
                        {
                            var existingParticipantForEditedHearing = existingParticipantsInEditedHearing.Find(x => x.Id == participantInRequest.Id);
                            if (existingParticipantForEditedHearing == null)
                            {
                                continue;
                            }

                            participantChanges.Add(new ParticipantChanges
                            {
                                ParticipantRequest = participantInRequest,
                                TitleChanged = participantInRequest.Title != existingParticipantForEditedHearing.Title,
                                DisplayNameChanged = participantInRequest.DisplayName != existingParticipantForEditedHearing.DisplayName,
                                OrganisationNameChanged = participantInRequest.OrganisationName != existingParticipantForEditedHearing.Organisation,
                                TelephoneChanged = participantInRequest.TelephoneNumber != existingParticipantForEditedHearing.TelephoneNumber,
                                RepresenteeChanged = participantInRequest.Representee != existingParticipantForEditedHearing.Representee
                            });
                        }
                        
                        // Removed participants
                        participantsRemovedForEditedHearing = GetRemovedParticipants(request.Participants.ToList(), hearing.Map()).ToList();
                        
                        // Linked participants
                        var linkedParticipantsInRequest = request.Participants
                            .SelectMany(x => x.LinkedParticipants)
                            .Select(x => new LinkedParticipant
                            {
                                LinkedId = x.LinkedId,
                                Type = x.Type
                            })
                            .ToList();
                        var existingLinkedParticipants = hearing.Participants
                            .SelectMany(x => x.LinkedParticipants)
                            .Select(x => new LinkedParticipant
                            {
                                LinkedId = x.LinkedId,
                                Type = LinkedParticipantType.Interpreter
                            })
                            .ToList();
                        
                        var newLinkedParticipants = linkedParticipantsInRequest
                            .Where(linked => !existingLinkedParticipants.Exists(existing => existing.LinkedId == linked.LinkedId && existing.Type == linked.Type))
                            .ToList();
                        
                        var removedLinkedParticipants = existingLinkedParticipants
                            .Where(existing => !linkedParticipantsInRequest.Exists(linked => linked.LinkedId == existing.LinkedId && linked.Type == existing.Type))
                            .ToList();

                        // We need to union these with each hearing
                        linkedParticipantChanges.NewLinkedParticipants = newLinkedParticipants;
                        linkedParticipantChanges.RemovedLinkedParticipants = removedLinkedParticipants;
                    }
                    
                    var hearingRequest = new HearingRequest
                    {
                        HearingId = hearing.Id,
                        ScheduledDuration = scheduledDurationChanged ? 
                            request.ScheduledDuration : hearing.ScheduledDuration,
                        HearingVenueName = hearingVenueNameChanged ? 
                            request.HearingVenueName : hearing.HearingVenueName,
                        HearingRoomName = hearingRoomNameChanged ? 
                            request.HearingRoomName : hearing.HearingRoomName,
                        OtherInformation = otherInformationChanged ? 
                            request.OtherInformation : hearing.OtherInformation,
                        CaseNumber = caseNumberChanged ? 
                            request.CaseNumber : hearing.Cases[0].Number,
                        AudioRecordingRequired = audioRecordingRequiredChanged ? 
                            request.AudioRecordingRequired : hearing.AudioRecordingRequired
                    };
                    
                    var hearingInGroup = request.HearingsInGroup.Find(h => h.HearingId == hearing.Id);
                    hearingRequest.ScheduledDateTime = hearingInGroup.ScheduledDateTime;
                
                    var hearingToUpdate = hearing.Map();

                    var participants = request.Participants.ToList();
                    var endpoints = request.Endpoints.ToList();
                    var isFutureDay = hearingToUpdate.Id != thisHearing.Id;

                    if (isFutureDay)
                    {
                        AssignParticipantIdsForEditMultiDayHearingFutureDay(hearingToUpdate, participants, endpoints);
                    }

                    if (hearing.Id != hearingId)
                    {
                        var participantsRequest = new UpdateHearingParticipantsRequest();
                        
                        var participantsForThisHearing = hearing.Participants.ToList();
                        
                        // New participants
                        participantsRequest.NewParticipants.AddRange(participantsForEditedHearing.NewParticipants);
                        
                        // Removed participants
                        // Get the participants removed relative to the edited hearing, and re-map their ids for this hearing
                        foreach (var removedParticipant in participantsRemovedForEditedHearing)
                        {
                            var participantToRemoveForThisHearing = participantsForThisHearing.Find(x => x.ContactEmail == removedParticipant.ContactEmail);
                            if (participantToRemoveForThisHearing != null)
                            {
                                participantsRequest.RemovedParticipantIds.Add(participantToRemoveForThisHearing.Id);
                            }
                        }
                        
                        // Existing participants
                        // Get the existing participants relative to the edited hearing, and work out which edits were made to them in the request.
                        // Apply only these edits to the existing participants for subsequent days in the hearing
                        foreach (var existingParticipant in participantsForThisHearing)
                        {
                            var participantInRequest = participantChanges.Find(x => x.ParticipantRequest.ContactEmail == existingParticipant.ContactEmail);
                            if (participantInRequest == null)
                            {
                                continue;
                            }
                            
                            var participantRequest = participantInRequest.ParticipantRequest;
                            
                            participantsRequest.ExistingParticipants.Add(new UpdateParticipantRequest
                            {
                                Title = participantInRequest.TitleChanged ? 
                                    participantRequest.Title : existingParticipant.Title,
                                DisplayName = participantInRequest.DisplayNameChanged ? 
                                    participantRequest.DisplayName : existingParticipant.DisplayName,
                                OrganisationName = participantInRequest.OrganisationNameChanged ? 
                                    participantRequest.OrganisationName : existingParticipant.Organisation,
                                TelephoneNumber = participantInRequest.TelephoneChanged ? 
                                    participantRequest.TelephoneNumber : existingParticipant.TelephoneNumber,
                                Representee = participantInRequest.RepresenteeChanged ? 
                                    participantRequest.Representee : existingParticipant.Representee,
                                ParticipantId = existingParticipant.Id,
                                ContactEmail = existingParticipant.ContactEmail
                            });
                        }

                        // Linked participants
                        // TODO determine which linked participants should be on this hearing after the update
                        var requestParticipants = request.Participants.ToList();
                        foreach (var requestParticipant in requestParticipants)
                        {
                            // Re-map their participant ids to the ones on this hearing
                            var participantOnThisHearing = hearing.Participants.Find(x => x.ContactEmail == requestParticipant.ContactEmail);
                            if (participantOnThisHearing == null)
                            {
                                continue;
                            }
                        }
                        
                        var updatedLinkedParticipantsForThisHearing = ExtractLinkedParticipants(request.Participants,
                            hearingToUpdate, participantsRequest.RemovedParticipantIds, new List<IUpdateParticipantRequest>(participantsRequest.ExistingParticipants),
                            new List<IParticipantRequest>(participantsRequest.NewParticipants));
                        var linkedParticipantsV1 = updatedLinkedParticipantsForThisHearing.Select(lp => lp.MapToV1()).ToList();

                        participantsRequest.LinkedParticipants = linkedParticipantsV1;

                        // Endpoints
                        // TODO determine which changes have been made to the edited hearing
                    }
                    else
                    {
                        hearingRequest.Participants = await MapUpdateHearingParticipantsRequestV1(hearingToUpdate.Id, participants, hearingToUpdate);
                        hearingRequest.Endpoints = _hearingsService.MapUpdateHearingEndpointsRequest(hearingId, endpoints, hearingToUpdate, new List<IParticipantRequest>(hearingRequest.Participants.NewParticipants));

                        participantsForEditedHearing = hearingRequest.Participants;
                        endpointsForEditedHearing = hearingRequest.Endpoints;
                    }
                    
                    bookingsApiRequest.Hearings.Add(hearingRequest);
                }

                await _bookingsApiClient.UpdateHearingsInGroupAsync(groupId, bookingsApiRequest);
            }

            async Task UpdateMultiDayHearingV2()
            {
                var bookingsApiRequest = new UpdateHearingsInGroupRequestV2
                {
                    UpdatedBy = _userIdentity.GetUserIdentityName()
                };
            
                foreach (var hearing in hearingsToUpdate)
                {
                    var hearingRequest = new HearingRequestV2
                    {
                        HearingId = hearing.Id,
                        ScheduledDuration = request.ScheduledDuration,
                        HearingVenueCode = request.HearingVenueCode,
                        HearingRoomName = request.HearingRoomName,
                        OtherInformation = request.OtherInformation,
                        CaseNumber = request.CaseNumber,
                        AudioRecordingRequired = request.AudioRecordingRequired
                    };
                    
                    var hearingInGroup = request.HearingsInGroup.Find(h => h.HearingId == hearing.Id);
                    hearingRequest.ScheduledDateTime = hearingInGroup.ScheduledDateTime;
                
                    var hearingToUpdate = hearing.Map();

                    var participants = request.Participants.ToList();
                    var judiciaryParticipants = request.JudiciaryParticipants.ToList();
                    var endpoints = request.Endpoints.ToList();
                    var isFutureDay = hearingToUpdate.Id != thisHearing.Id;

                    if (isFutureDay)
                    {
                        AssignParticipantIdsForEditMultiDayHearingFutureDay(hearingToUpdate, participants, endpoints);
                    }
                
                    hearingRequest.Participants = await MapUpdateHearingParticipantsRequestV2(hearingToUpdate.Id, participants, hearingToUpdate);
                    
                    var endpointsV1 = _hearingsService.MapUpdateHearingEndpointsRequest(hearingId, endpoints, hearingToUpdate, new List<IParticipantRequest>(hearingRequest.Participants.NewParticipants));
                    var endpointsV2 = new UpdateHearingEndpointsRequestV2
                    {
                        NewEndpoints = endpointsV1.NewEndpoints
                            .Select(v1 => new EndpointRequestV2
                            {
                                DisplayName = v1.DisplayName,
                                DefenceAdvocateContactEmail = v1.DefenceAdvocateContactEmail
                            })
                            .ToList(),
                        ExistingEndpoints = endpointsV1.ExistingEndpoints
                            .Select(v1 => new UpdateEndpointRequestV2
                            {
                                Id = v1.Id,
                                DisplayName = v1.DisplayName,
                                DefenceAdvocateContactEmail = v1.DefenceAdvocateContactEmail
                            })
                            .ToList(),
                        RemovedEndpointIds = endpointsV1.RemovedEndpointIds.ToList()
                    };
                    hearingRequest.Endpoints = endpointsV2;
                    hearingRequest.JudiciaryParticipants = MapUpdateJudiciaryParticipantsRequestV2(judiciaryParticipants, hearingToUpdate, skipUnchangedParticipants: false);
                
                    bookingsApiRequest.Hearings.Add(hearingRequest);
                }

                await _bookingsApiClient.UpdateHearingsInGroupV2Async(groupId, bookingsApiRequest);
            }
        }

        private async Task CancelMultiDayHearing(CancelMultiDayHearingRequest request, Guid hearingId, Guid groupId)
        {
            var hearingsInMultiDay = await _bookingsApiClient.GetHearingsByGroupIdAsync(groupId);
            var thisHearing = hearingsInMultiDay.First(x => x.Id == hearingId);
            
            var hearingsToCancel = new List<BookingsApi.Contract.V1.Responses.HearingDetailsResponse>
            {
                thisHearing
            };
            
            if (request.UpdateFutureDays)
            {
                var futureHearings = hearingsInMultiDay.Where(x => x.ScheduledDateTime.Date > thisHearing.ScheduledDateTime.Date);
                hearingsToCancel.AddRange(futureHearings.ToList());
            }

            // Hearings with these statuses will be rejected by bookings api, so filter them out
            hearingsToCancel = hearingsToCancel
                .Where(h => 
                    h.Status != BookingsApi.Contract.V1.Enums.BookingStatus.Cancelled && 
                    h.Status != BookingsApi.Contract.V1.Enums.BookingStatus.Failed)
                .ToList();

            var cancelRequest = new CancelHearingsInGroupRequest
            {
                HearingIds = hearingsToCancel.Select(h => h.Id).ToList(),
                CancelReason = request.CancelReason,
                UpdatedBy = _userIdentity.GetUserIdentityName()
            };

            await _bookingsApiClient.CancelHearingsInGroupAsync(groupId, cancelRequest);
        }

        private static void AssignParticipantIdsForEditMultiDayHearingFutureDay(HearingDetailsResponse multiDayHearingFutureDay, 
            List<EditParticipantRequest> participants, 
            List<EditEndpointRequest> endpoints)
        {
            // For the future day hearings, the participant ids will be different
            // So we need to set their ids to null if they are new participants, or use their existing ids if they already exist
                    
            foreach (var participant in participants)
            {
                var existingParticipant = multiDayHearingFutureDay.Participants.Find(x => x.ContactEmail == participant.ContactEmail);
                if (existingParticipant == null)
                {
                    participant.Id = null;
                            
                }
                else
                {
                    participant.Id = existingParticipant.Id;
                }
                
                // TODO update linked participants
            }

            foreach (var endpoint in endpoints)
            {
                // Unlike participants we don't have a common identifier, so need to remove the existing endpoints and replace them
                endpoint.Id = null;
            }
        }

        private async Task UpdateParticipantsV1(Guid hearingId, List<EditParticipantRequest> participants, List<EditEndpointRequest> endpoints, HearingDetailsResponse originalHearing)
        {
            var request = await MapUpdateHearingParticipantsRequestV1(hearingId, participants, originalHearing);

            await _hearingsService.ProcessParticipants(hearingId, request.ExistingParticipants, request.NewParticipants, request.RemovedParticipantIds, request.LinkedParticipants);
            await _hearingsService.ProcessEndpoints(hearingId, endpoints, originalHearing, new List<IParticipantRequest>(request.NewParticipants));
        }

        private async Task<UpdateHearingParticipantsRequest> MapUpdateHearingParticipantsRequestV1(Guid hearingId, 
            List<EditParticipantRequest> participants, 
            HearingDetailsResponse originalHearing)
        {
            var existingParticipants = new List<UpdateParticipantRequest>();
            var newParticipants = new List<ParticipantRequest>();
            var removedParticipantIds = GetRemovedParticipantIds(participants, originalHearing);

            foreach (var participant in participants)
            {
                var newParticipantToAdd = NewParticipantRequestMapper.MapTo(participant);
                if (participant.Id.HasValue)
                    ExtractExistingParticipants(originalHearing, participant, existingParticipants);
                else if (await _hearingsService.ProcessNewParticipant(hearingId, participant, newParticipantToAdd, removedParticipantIds, originalHearing) is { } newParticipant)
                    newParticipants.Add((ParticipantRequest)newParticipant);
            }
            
            var linkedParticipants = ExtractLinkedParticipants(participants, originalHearing, removedParticipantIds, new List<IUpdateParticipantRequest>(existingParticipants), new List<IParticipantRequest>(newParticipants));
            var linkedParticipantsV1 = linkedParticipants.Select(lp => lp.MapToV1()).ToList();
            
            var updateHearingParticipantsRequest = new UpdateHearingParticipantsRequest
            {
                ExistingParticipants = existingParticipants,
                NewParticipants = newParticipants,
                RemovedParticipantIds = removedParticipantIds,
                LinkedParticipants = linkedParticipantsV1
            };

            return updateHearingParticipantsRequest;
        }
        
        private async Task UpdateParticipantsV2(Guid hearingId, List<EditParticipantRequest> participants, List<EditEndpointRequest> endpoints, HearingDetailsResponse originalHearing)
        {
            var request = await MapUpdateHearingParticipantsRequestV2(hearingId, participants, originalHearing);

            if (participants.Any() || request.RemovedParticipantIds.Any())
                await _hearingsService.ProcessParticipantsV2(hearingId, request.ExistingParticipants, request.NewParticipants, request.RemovedParticipantIds, request.LinkedParticipants);
            
            await _hearingsService.ProcessEndpoints(hearingId, endpoints, originalHearing, new List<IParticipantRequest>(request.NewParticipants));
        }

        private async Task<UpdateHearingParticipantsRequestV2> MapUpdateHearingParticipantsRequestV2(Guid hearingId,
            List<EditParticipantRequest> participants,
            HearingDetailsResponse originalHearing)
        {
            var existingParticipants = new List<UpdateParticipantRequestV2>();
            var newParticipants = new List<ParticipantRequestV2>();
            var removedParticipantIds = GetRemovedParticipantIds(participants, originalHearing);

            foreach (var participant in participants)
            {
                var newParticipantToAdd = NewParticipantRequestMapper.MapToV2(participant);
                if (participant.Id.HasValue)
                    ExtractExistingParticipantsV2(originalHearing, participant, existingParticipants);
                else if (await _hearingsService.ProcessNewParticipant(hearingId, participant, newParticipantToAdd, removedParticipantIds, originalHearing) is { } newParticipant)
                    newParticipants.Add((ParticipantRequestV2)newParticipant);
            }
            
            var linkedParticipants = ExtractLinkedParticipants(participants, originalHearing, removedParticipantIds, new List<IUpdateParticipantRequest>(existingParticipants), new List<IParticipantRequest>(newParticipants));
            var linkedParticipantsV2 = linkedParticipants.Select(lp => lp.MapToV2()).ToList();

            var updateHearingParticipantsRequest = new UpdateHearingParticipantsRequestV2
            {
                ExistingParticipants = existingParticipants,
                NewParticipants = newParticipants,
                RemovedParticipantIds = removedParticipantIds,
                LinkedParticipants = linkedParticipantsV2
            };

            return updateHearingParticipantsRequest;
        }

        private static List<Guid> GetRemovedParticipantIds(List<EditParticipantRequest> participants, HearingDetailsResponse originalHearing)
        {
            return GetRemovedParticipants(participants, originalHearing)
                .Select(x => x.Id).ToList();
        }

        private static IEnumerable<ParticipantResponse> GetRemovedParticipants(List<EditParticipantRequest> participants, HearingDetailsResponse originalHearing)
        {
            return originalHearing.Participants.Where(p => participants.TrueForAll(rp => rp.Id != p.Id))
                .Select(x => x).ToList();
        }

        private async Task UpdateJudiciaryParticipants(Guid hearingId, List<JudiciaryParticipantRequest> judiciaryParticipants,
            HearingDetailsResponse originalHearing)
        {
            var request = MapUpdateJudiciaryParticipantsRequestV2(judiciaryParticipants, originalHearing);
            
            // Due to booking api's domain restrictions for removing participants, we have to update judges differently
            var oldJudge = originalHearing.JudiciaryParticipants.Find(ojp => ojp.RoleCode == "Judge");
            var newJudge = judiciaryParticipants.Find(njp => njp.Role == "Judge");
            if (oldJudge?.PersonalCode != newJudge?.PersonalCode && newJudge != null)
            {
                await _bookingsApiClient.ReassignJudiciaryJudgeAsync(hearingId, new ReassignJudiciaryJudgeRequest
                {
                    DisplayName = newJudge.DisplayName,
                    PersonalCode = newJudge.PersonalCode,
                    OptionalContactEmail = newJudge.OptionalContactEmail
                });
            }

            foreach (var removedJohPersonalCode in request.RemovedJudiciaryParticipantPersonalCodes)
            {
                var removedJoh = originalHearing.JudiciaryParticipants.Find(p => p.PersonalCode == removedJohPersonalCode);
                if (removedJoh.RoleCode == "Judge")
                {
                    // Judges are re-assigned instead of removed or added
                    continue;
                }
                
                await _bookingsApiClient.RemoveJudiciaryParticipantFromHearingAsync(hearingId, removedJoh.PersonalCode);
            }

            var johsToAdd = request.NewJudiciaryParticipants
                .Select(jp => new BookingsApi.Contract.V1.Requests.JudiciaryParticipantRequest()
                {
                    DisplayName = jp.DisplayName,
                    PersonalCode = jp.PersonalCode,
                    HearingRoleCode = jp.HearingRoleCode == JudiciaryParticipantHearingRoleCodeV2.Judge ? JudiciaryParticipantHearingRoleCode.Judge
                        : JudiciaryParticipantHearingRoleCode.PanelMember
                })
                // Judges are re-assigned instead of removed or added
                .Where(jp => jp.HearingRoleCode != JudiciaryParticipantHearingRoleCode.Judge)
                .ToList();
         
            if (johsToAdd.Any())
            {
                await _bookingsApiClient.AddJudiciaryParticipantsToHearingAsync(hearingId, johsToAdd);
            }

            foreach (var joh in request.ExistingJudiciaryParticipants)
            {
                var roleCode = joh.HearingRoleCode == JudiciaryParticipantHearingRoleCodeV2.Judge ? JudiciaryParticipantHearingRoleCode.Judge
                    : JudiciaryParticipantHearingRoleCode.PanelMember;
                
                await _bookingsApiClient.UpdateJudiciaryParticipantAsync(hearingId, joh.PersonalCode,
                    new UpdateJudiciaryParticipantRequest()
                    {
                        DisplayName = joh.DisplayName, HearingRoleCode = roleCode
                    });
            }
        }

        private static UpdateJudiciaryParticipantsRequestV2 MapUpdateJudiciaryParticipantsRequestV2(List<JudiciaryParticipantRequest> judiciaryParticipants,
            HearingDetailsResponse originalHearing, bool skipUnchangedParticipants = true)
        {
            var request = new UpdateJudiciaryParticipantsRequestV2();
            
            // keep the order of removal first. this will allow admin web to change judiciary judges post booking
            var removedJohs = originalHearing.JudiciaryParticipants.Where(ojp =>
                judiciaryParticipants.TrueForAll(jp => jp.PersonalCode != ojp.PersonalCode)).ToList();
            foreach (var removedJoh in removedJohs)
            {
                request.RemovedJudiciaryParticipantPersonalCodes.Add(removedJoh.PersonalCode);
            }
            
            var newJohs = judiciaryParticipants.Where(jp =>
                !originalHearing.JudiciaryParticipants.Exists(ojp => ojp.PersonalCode == jp.PersonalCode)).ToList();

            var newJohRequest = newJohs.Select(jp =>
            {
                var roleCode = Enum.Parse<JudiciaryParticipantHearingRoleCode>(jp.Role);
                return new BookingsApi.Contract.V1.Requests.JudiciaryParticipantRequest()
                {
                    DisplayName = jp.DisplayName,
                    PersonalCode = jp.PersonalCode,
                    HearingRoleCode = roleCode,
                    ContactEmail = jp.OptionalContactEmail
                };
            }).ToList();
            if (newJohRequest.Any())
            {
                var johsToAdd = newJohRequest
                    .ToList();

                if (johsToAdd.Any())
                {
                    var newParticipants = johsToAdd
                        .Select(x => new JudiciaryParticipantRequestV2
                        {
                            ContactEmail = x.ContactEmail,
                            DisplayName = x.DisplayName,
                            PersonalCode = x.PersonalCode,
                            HearingRoleCode = x.HearingRoleCode == JudiciaryParticipantHearingRoleCode.Judge ? JudiciaryParticipantHearingRoleCodeV2.Judge
                                : JudiciaryParticipantHearingRoleCodeV2.PanelMember,
                            ContactTelephone = x.ContactTelephone
                        })
                        .ToList();
                    
                    request.NewJudiciaryParticipants.AddRange(newParticipants);
                }
            }
            
            request.ExistingJudiciaryParticipants = MapExistingJudiciaryParticipants(judiciaryParticipants, 
                originalHearing, 
                skipUnchangedParticipants: skipUnchangedParticipants);

            return request;
        }

        private static List<EditableUpdateJudiciaryParticipantRequestV2> MapExistingJudiciaryParticipants(IEnumerable<JudiciaryParticipantRequest> judiciaryParticipantsToUpdate,
            HearingDetailsResponse originalHearing, bool skipUnchangedParticipants = true)
        {
            // get existing judiciary participants based on the personal code being present in the original hearing
            var existingJohs = judiciaryParticipantsToUpdate.Where(jp =>
                originalHearing.JudiciaryParticipants.Exists(ojp => ojp.PersonalCode == jp.PersonalCode)).ToList();

            var existingJudiciaryParticipants = new List<EditableUpdateJudiciaryParticipantRequestV2>();
            
            foreach (var joh in existingJohs)
            {
                if (skipUnchangedParticipants)
                {
                    // Only update the joh if their details have changed
                    var originalJoh = originalHearing.JudiciaryParticipants.Find(x => x.PersonalCode == joh.PersonalCode);
                    if (joh.DisplayName == originalJoh.DisplayName &&
                        joh.Role == originalJoh.RoleCode)
                    {
                        continue;
                    }
                }
                
                var roleCode = Enum.Parse<JudiciaryParticipantHearingRoleCode>(joh.Role);
                existingJudiciaryParticipants.Add(new EditableUpdateJudiciaryParticipantRequestV2
                {
                    PersonalCode = joh.PersonalCode,
                    DisplayName = joh.DisplayName,
                    HearingRoleCode = roleCode == JudiciaryParticipantHearingRoleCode.Judge ? JudiciaryParticipantHearingRoleCodeV2.Judge
                        : JudiciaryParticipantHearingRoleCodeV2.PanelMember
                });
            }

            return existingJudiciaryParticipants;
        }

        private static List<LinkedParticipantRequest> ExtractLinkedParticipants(
            List<EditParticipantRequest> participants, 
            HearingDetailsResponse originalHearing,
            List<Guid> removedParticipantIds, 
            List<IUpdateParticipantRequest> existingParticipants, 
            List<IParticipantRequest> newParticipants)
        {
            var linkedParticipants = new List<LinkedParticipantRequest>();
            var participantsWithLinks = participants
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
                    ParticipantContactEmail = participantWithLinks.LinkedParticipants[0].ParticipantContactEmail ?? participantWithLinks.ContactEmail,
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
            var existingParticipant = originalHearing.Participants.Find(p => p.Id.Equals(participant.Id));
            if (existingParticipant == null || string.IsNullOrEmpty(existingParticipant.UserRoleName))
                return;
            
            var updateParticipantRequest = UpdateParticipantRequestMapper.MapTo(participant);
            existingParticipants.Add(updateParticipantRequest);
        }
        
        private static void ExtractExistingParticipantsV2(
            HearingDetailsResponse originalHearing,
            EditParticipantRequest participant, 
            List<UpdateParticipantRequestV2> existingParticipants)
        {
            var existingParticipant = originalHearing.Participants.Find(p => p.Id.Equals(participant.Id));
            if (existingParticipant == null || string.IsNullOrEmpty(existingParticipant.UserRoleName))
                return;
            
            var updateParticipantRequest = UpdateParticipantRequestMapper.MapToV2(participant);
            existingParticipants.Add(updateParticipantRequest);
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
                if (_featureToggles.UseV2Api())
                {
                    var response = await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId);
                    ICollection<HearingDetailsResponseV2> groupedHearings = null;
                    if (response.GroupId != null)
                    {
                        groupedHearings = await _bookingsApiClient.GetHearingsByGroupIdV2Async(response.GroupId.Value);
                    }
                    hearingResponse = response.Map(groupedHearings);
                }
                else
                {
                    var response = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
                    ICollection<BookingsApi.Contract.V1.Responses.HearingDetailsResponse> groupedHearings = null;
                    if (response.GroupId != null)
                    {
                        groupedHearings = await _bookingsApiClient.GetHearingsByGroupIdAsync(response.GroupId.Value);
                    }
                    hearingResponse = response.Map(groupedHearings);
                }
                return Ok(hearingResponse);
            }
            catch (BookingsApiException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.BadRequest) return BadRequest(e.Response);
                return StatusCode(500, e.Message);
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
                return StatusCode(500, ex.Message);
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
                _logger.LogDebug("Hearing {1} is booked. Polling for the status in BookingsApi", hearingId);
                var response = await GetHearing(hearingId);
                var participantsNeedVHAccounts = ParticipantsNeedVHAccounts(response.Participants);
                var accountsStillNeedCreating = participantsNeedVHAccounts.Any(x => x.ContactEmail == x.Username);
                var isMultiDay = response.GroupId != null;
                var isNotifyFlagOn = _featureToggles.UsePostMay2023Template();
                if (isMultiDay && isNotifyFlagOn)
                {
                    // Users are created as part of the clone process, so don't wait for them here
                    accountsStillNeedCreating = false;
                }
                
                VideoApi.Contract.Responses.ConferenceDetailsResponse conferenceDetailsResponse;
                
                if (response.Status == BookingStatus.Created && !accountsStillNeedCreating)
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
        ///  Cancel the booking
        /// </summary>
        /// <param name="hearingId">The hearing id</param>
        /// <param name="reason">The reason the hearing has been cancelled</param>
        /// <returns>Success status</returns>
        [HttpPatch("{hearingId}/cancel")]
        [SwaggerOperation(OperationId = "CancelBooking")]
        [ProducesResponseType(typeof(UpdateBookingStatusResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> CancelBooking(Guid hearingId, string reason)
        {
            try
            {
                var cancelRequest = new CancelBookingRequest
                {
                    CancelReason = reason,
                    UpdatedBy = _userIdentity.GetUserIdentityName()
                };
                await _bookingsApiClient.CancelBookingAsync(hearingId, cancelRequest);

                _logger.LogDebug("Updated hearing {Hearing} to booking status {BookingStatus}", hearingId, BookingStatus.Cancelled);
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
        public async Task<IActionResult> UpdateFailedBookingStatus(Guid hearingId)
        {
            var errorMessage = $"Failed to update the failed status for a hearing - hearingId: {hearingId}";
            try
            {
                await _bookingsApiClient.FailBookingAsync(hearingId);
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
                return StatusCode(500, e.Message);
            }
        }

        private IEnumerable<ParticipantResponse> ParticipantsNeedVHAccounts(List<ParticipantResponse> allParticipants)
        {
            IEnumerable<ParticipantResponse> participantsNeedVHAccounts;
            if (_featureToggles.UseV2Api())
            {
                participantsNeedVHAccounts = allParticipants.Where(x => x.UserRoleName == RoleNames.Individual || x.UserRoleName == RoleNames.Representative);
            }
            else
            {
                participantsNeedVHAccounts = allParticipants.Where(x => x.UserRoleName != RoleNames.Judge);
            }

            return participantsNeedVHAccounts;
        }

        private class ParticipantChanges
        {
            public EditParticipantRequest ParticipantRequest { get; set; }
            public bool TitleChanged { get; set; }
            public bool DisplayNameChanged { get; set; }
            public bool OrganisationNameChanged { get; set; }
            public bool TelephoneChanged { get; set; }
            public bool RepresenteeChanged { get; set; }
        }

        private sealed class LinkedParticipantChanges
        {
            public List<LinkedParticipant> NewLinkedParticipants { get; set; } = new();
            public List<LinkedParticipant> RemovedLinkedParticipants { get; set; } = new();
        }

        private sealed class LinkedParticipant
        {
            public Guid LinkedId { get; set; }
            public LinkedParticipantType Type { get; set; }
        }
    }
}