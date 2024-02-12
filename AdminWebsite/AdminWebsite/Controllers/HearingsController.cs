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
                throw;
            }
            catch (Exception e)
            {
                _logger.LogError(e, "BookNewHearing - Failed to save hearing - {Message} -  for request: {RequestBody}",
                    e.Message, JsonConvert.SerializeObject(newBookingRequest));
                throw;
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
                
                throw;
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
                throw;
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

            foreach (var hearing in hearingsToUpdate)
            {
                var hearingToUpdate = hearing.Map();

                var participants = request.Participants.ToList();
                var judiciaryParticipants = request.JudiciaryParticipants.ToList();
                var endpoints = request.Endpoints.ToList();
                var isFutureDay = hearingToUpdate.Id != thisHearing.Id;

                if (isFutureDay)
                {
                    AssignParticipantIdsForEditMultiDayHearingFutureDay(hearingToUpdate, participants, endpoints);
                }
                
                if (_featureToggles.UseV2Api())
                {
                    await UpdateParticipantsV2(hearingToUpdate.Id, participants, endpoints, hearingToUpdate);
                    await UpdateJudiciaryParticipants(hearingToUpdate.Id, judiciaryParticipants, hearingToUpdate);
                }
                else
                {
                    await UpdateParticipantsV1(hearingToUpdate.Id, participants, endpoints, hearingToUpdate);
                }
            }
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
            }

            foreach (var endpoint in endpoints)
            {
                // Unlike participants we don't have a common identifier, so need to remove the existing endpoints and replace them
                endpoint.Id = null;
            }
        }

        private async Task UpdateParticipantsV1(Guid hearingId, List<EditParticipantRequest> participants, List<EditEndpointRequest> endpoints, HearingDetailsResponse originalHearing)
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
            
            await _hearingsService.ProcessParticipants(hearingId, existingParticipants, newParticipants, removedParticipantIds.ToList(), linkedParticipantsV1);
            await _hearingsService.ProcessEndpoints(hearingId, endpoints, originalHearing, new List<IParticipantRequest>(newParticipants));
        }
        
        private async Task UpdateParticipantsV2(Guid hearingId, List<EditParticipantRequest> participants, List<EditEndpointRequest> endpoints, HearingDetailsResponse originalHearing)
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

            if (participants.Any() || removedParticipantIds.Any())
                await _hearingsService.ProcessParticipantsV2(hearingId, existingParticipants, newParticipants, removedParticipantIds, linkedParticipantsV2);
            
            await _hearingsService.ProcessEndpoints(hearingId, endpoints, originalHearing, new List<IParticipantRequest>(newParticipants));
        }
        
        private static List<Guid> GetRemovedParticipantIds(List<EditParticipantRequest> participants, HearingDetailsResponse originalHearing)
        {
            return originalHearing.Participants.Where(p => participants.TrueForAll(rp => rp.Id != p.Id))
                .Select(x => x.Id).ToList();
        }

        private async Task UpdateJudiciaryParticipants(Guid hearingId, List<JudiciaryParticipantRequest> judiciaryParticipants,
            HearingDetailsResponse originalHearing)
        {
            // Due to booking api's domain restrictions for removing participants, we have to update judges differently
            var oldJudge = originalHearing.JudiciaryParticipants.Find(ojp => ojp.RoleCode == "Judge");
            var newJudge = judiciaryParticipants.Find(njp => njp.Role == "Judge");
            if (oldJudge?.PersonalCode != newJudge?.PersonalCode && newJudge != null)
            {
                await _bookingsApiClient.ReassignJudiciaryJudgeAsync(hearingId, new ReassignJudiciaryJudgeRequest
                {
                    DisplayName = newJudge.DisplayName,
                    PersonalCode = newJudge.PersonalCode
                });
            }
            
            // keep the order of removal first. this will allow admin web to change judiciary judges post booking
            var removedJohs = originalHearing.JudiciaryParticipants.Where(ojp =>
                judiciaryParticipants.TrueForAll(jp => jp.PersonalCode != ojp.PersonalCode)).ToList();
            foreach (var removedJoh in removedJohs)
            {
                if (removedJoh.RoleCode == "Judge")
                {
                    // Judges are re-assigned instead of removed or added
                    continue;
                }
                
                await _bookingsApiClient.RemoveJudiciaryParticipantFromHearingAsync(hearingId, removedJoh.PersonalCode);
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
                    HearingRoleCode = roleCode
                };
            }).ToList();
            if (newJohRequest.Any())
            {
                // Judges are re-assigned instead of removed or added
                var johsToAdd = newJohRequest
                    .Where(x => x.HearingRoleCode != JudiciaryParticipantHearingRoleCode.Judge)
                    .ToList();

                if (johsToAdd.Any())
                {
                    await _bookingsApiClient.AddJudiciaryParticipantsToHearingAsync(hearingId, johsToAdd);
                }
            }
            
            // get existing judiciary participants based on the personal code being present in the original hearing
            var existingJohs = judiciaryParticipants.Where(jp =>
                originalHearing.JudiciaryParticipants.Exists(ojp => ojp.PersonalCode == jp.PersonalCode)).ToList();

            foreach (var joh in existingJohs)
            {
                // Only update the joh if their details have changed
                var originalJoh = originalHearing.JudiciaryParticipants.Find(x => x.PersonalCode == joh.PersonalCode);
                if (joh.DisplayName == originalJoh.DisplayName &&
                    joh.Role == originalJoh.RoleCode)
                {
                    continue;
                }
                
                var roleCode = Enum.Parse<JudiciaryParticipantHearingRoleCode>(joh.Role);
                await _bookingsApiClient.UpdateJudiciaryParticipantAsync(hearingId, joh.PersonalCode,
                    new UpdateJudiciaryParticipantRequest()
                    {
                        DisplayName = joh.DisplayName, HearingRoleCode = roleCode
                    });
            }
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
                throw;
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
    }
}