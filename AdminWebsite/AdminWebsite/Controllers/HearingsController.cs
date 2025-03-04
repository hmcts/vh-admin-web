using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Attributes;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Extensions;
using AdminWebsite.Helper;
using AdminWebsite.Mappers;
using AdminWebsite.Mappers.EditMultiDayHearing;
using AdminWebsite.Models;
using AdminWebsite.Models.EditMultiDayHearing;
using AdminWebsite.Security;
using AdminWebsite.Services;
using BookingsApi.Client;
using BookingsApi.Contract.Interfaces.Requests;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using HearingDetailsResponse = AdminWebsite.Contracts.Responses.HearingDetailsResponse;
using JudiciaryParticipantRequest = AdminWebsite.Contracts.Requests.JudiciaryParticipantRequest;
using JudiciaryParticipantResponse = AdminWebsite.Contracts.Responses.JudiciaryParticipantResponse;
using LinkedParticipantRequest = AdminWebsite.Contracts.Requests.LinkedParticipantRequest;
using ParticipantResponse = AdminWebsite.Contracts.Responses.ParticipantResponse;

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
        private readonly IHearingsService _hearingsService;
        private readonly IConferenceDetailsService _conferenceDetailsService;
        private readonly ILogger<HearingsController> _logger;
        private readonly IUserIdentity _userIdentity;

        /// <summary>
        ///     Instantiates the controller
        /// </summary>
#pragma warning disable S107
        public HearingsController(IBookingsApiClient bookingsApiClient, 
            IUserIdentity userIdentity,
            ILogger<HearingsController> logger, 
            IHearingsService hearingsService,
            IConferenceDetailsService conferenceDetailsService)
        {
            _bookingsApiClient = bookingsApiClient;
            _userIdentity = userIdentity;
            _logger = logger;
            _hearingsService = hearingsService;
            _conferenceDetailsService = conferenceDetailsService;
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
                if (newBookingRequest.Endpoints != null && newBookingRequest.Endpoints.Count != 0)
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

        private async Task<HearingDetailsResponse> BookNewHearing(BookingDetailsRequest newBookingRequest)
        {
            _logger.LogInformation("BookNewHearing - Attempting to send booking request to Booking API");
            var newBookingRequestV2 = newBookingRequest.MapToV2();
            var hearingDetailsResponse = await _bookingsApiClient.BookNewHearingWithCodeAsync(newBookingRequestV2);
            var hearingId = hearingDetailsResponse.Id;
            var response = hearingDetailsResponse.Map();
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
            
            if (hearingDates.Count == 0)
            {
                _logger.LogWarning("No working dates provided to clone to");
                return BadRequest();
            }

            var cloneHearingRequest = new CloneHearingRequestV2()
            {
                Dates = hearingDates, 
                ScheduledDuration = hearingRequest.ScheduledDuration
            };

            try
            {
                _logger.LogDebug("Sending request to clone hearing to Bookings API");
                await _bookingsApiClient.CloneHearingAsync(hearingId, cloneHearingRequest);
                _logger.LogDebug("Successfully cloned hearing {Hearing}", hearingId);

                var groupedHearings = await _bookingsApiClient.GetHearingsByGroupIdV2Async(hearingId);

                var conferenceStatusToGet = groupedHearings.Where(x => x.Participants?
                    .Exists(gh => gh.HearingRoleName == RoleNames.Judge) ?? false);
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
            var responseV2 = await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId);
            return responseV2.Map();
        }

        private async Task<HearingDetailsResponse> MapHearingToUpdate(Guid hearingId)
        {
            var updatedHearing2 = await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId);
            return updatedHearing2.Map();
        }

        private async Task UpdateHearing(EditHearingRequest request, Guid hearingId, HearingDetailsResponse originalHearing)
        {
            //Save hearing details
            
            // Adding an interpreter forces the audio recording to be required. The update hearing details do not work
            // with the close to start time window, but the domain will update the audio recording required flag when
            // an interpreter is added. Revert to the original audio recording setting to avoid the time clash.
            // This is only an issue because we update hearing details and participants in the same request.
            var containsInterpreter =
                request.Participants.Exists(p => p.IsInterpreter());
            
            if(containsInterpreter)
            {
                // revert to the original audio recording setting if an interpreter is added so that the domain rules
                // kick in rather than using update hearing details which do not work with the close to start time window
                request.AudioRecordingRequired = originalHearing.AudioRecordingRequired;
            }
            
            var updateHearingRequestV2 = HearingUpdateRequestMapper.MapToV2(request, _userIdentity.GetUserIdentityName());
            await _bookingsApiClient.UpdateHearingDetailsV2Async(hearingId, updateHearingRequestV2);
            await UpdateParticipantsAndEndpointsV2(hearingId, request.Participants, request.Endpoints, originalHearing);
            await UpdateJudiciaryParticipants(hearingId, request.JudiciaryParticipants, originalHearing);
        }

        private async Task UpdateMultiDayHearing(EditMultiDayHearingRequest request, Guid hearingId, Guid groupId)
        {
            var hearingsInMultiDay = await _bookingsApiClient.GetHearingsByGroupIdV2Async(groupId);
            var thisHearing = hearingsInMultiDay.First(x => x.Id == hearingId);
            
            var hearingsToUpdate = new List<HearingDetailsResponseV2>
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
                    h.Status != BookingStatusV2.Cancelled && 
                    h.Status != BookingStatusV2.Failed)
                .ToList();
                
            await UpdateMultiDayHearingV2(hearingsToUpdate, hearingId, groupId, request);
        }
        
        private async Task UpdateMultiDayHearingV2(
            List<HearingDetailsResponseV2> hearingsToUpdate,
            Guid originalEditedHearingId,
            Guid groupId,
            EditMultiDayHearingRequest request)
        {
            var bookingsApiRequest = new UpdateHearingsInGroupRequestV2
            {
                UpdatedBy = _userIdentity.GetUserIdentityName()
            };

            var participantsForEditedHearing = new UpdateHearingParticipantsRequestV2();
            var hearingChanges = new HearingChanges();
            
            foreach (var hearing in hearingsToUpdate)
            {
                var isFutureDay = hearing.Id != originalEditedHearingId;
                
                if (!isFutureDay)
                {
                    hearingChanges = HearingChangesMapper.MapHearingChanges(hearing, request);
                }
                
                var hearingRequest = HearingRequestMapper.MapHearingRequestV2(hearing, hearingChanges, request);
                
                var hearingInGroup = request.HearingsInGroup.Find(h => h.HearingId == hearing.Id);
                hearingRequest.ScheduledDateTime = hearingInGroup.ScheduledDateTime;
            
                var hearingToUpdate = hearing.Map();
                
                var participants = request.Participants.ToList();
                var endpoints = request.Endpoints.ToList();
                var judiciaryParticipants = request.JudiciaryParticipants.ToList();

                if (isFutureDay)
                {
                    ParticipantIdMapper.AssignParticipantIdsForFutureDayHearing(hearingToUpdate, participants, endpoints);

                    hearingRequest.Participants = UpdateHearingParticipantsRequestV2Mapper.MapParticipantsForFutureDayHearingV2(
                        hearing,
                        participantsForEditedHearing,
                        hearingChanges);

                    var newParticipantList = new List<IParticipantRequest>(hearingRequest.Participants.NewParticipants);

                    hearingRequest.Endpoints = _hearingsService.MapUpdateHearingEndpointsRequestV2(originalEditedHearingId, endpoints, hearingToUpdate, newParticipantList, hearingChanges: hearingChanges);
                    hearingRequest.JudiciaryParticipants = MapUpdateJudiciaryParticipantsRequestV2(judiciaryParticipants, hearingToUpdate, skipUnchangedParticipants: false, hearingChanges: hearingChanges);
                }
                else
                {
                    hearingRequest.Participants = await MapUpdateHearingParticipantsRequestV2(hearingToUpdate.Id, participants, hearingToUpdate);
                    
                    var newParticipantList = new List<IParticipantRequest>(hearingRequest.Participants.NewParticipants);
                    
                    hearingRequest.Endpoints = _hearingsService.MapUpdateHearingEndpointsRequestV2(originalEditedHearingId, endpoints, hearingToUpdate, newParticipantList, hearingChanges: hearingChanges);
                    hearingRequest.JudiciaryParticipants = MapUpdateJudiciaryParticipantsRequestV2(judiciaryParticipants, hearingToUpdate, skipUnchangedParticipants: false);
                    
                    participantsForEditedHearing = hearingRequest.Participants;
                }
                
                bookingsApiRequest.Hearings.Add(hearingRequest);
            }

            await _bookingsApiClient.UpdateHearingsInGroupV2Async(groupId, bookingsApiRequest);
        }

        private async Task CancelMultiDayHearing(CancelMultiDayHearingRequest request, Guid hearingId, Guid groupId)
        {
            var hearingsInMultiDay = await _bookingsApiClient.GetHearingsByGroupIdV2Async(groupId);
            var thisHearing = hearingsInMultiDay.First(x => x.Id == hearingId);
            
            var hearingsToCancel = new List<HearingDetailsResponseV2>
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
                    h.Status != BookingStatusV2.Cancelled && 
                    h.Status != BookingStatusV2.Failed)
                .ToList();

            var cancelRequest = new CancelHearingsInGroupRequest
            {
                HearingIds = hearingsToCancel.Select(h => h.Id).ToList(),
                CancelReason = request.CancelReason,
                UpdatedBy = _userIdentity.GetUserIdentityName()
            };

            await _bookingsApiClient.CancelHearingsInGroupAsync(groupId, cancelRequest);
        }
        
        private async Task UpdateParticipantsAndEndpointsV2(Guid hearingId, List<EditParticipantRequest> participants, List<EditEndpointRequest> endpoints, HearingDetailsResponse originalHearing)
        {
            var request = await MapUpdateHearingParticipantsRequestV2(hearingId, participants, originalHearing);

            if (participants.Count != 0 || request.RemovedParticipantIds.Count != 0)
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

        private static List<ParticipantResponse> GetRemovedParticipants(List<EditParticipantRequest> participants, HearingDetailsResponse originalHearing)
        {
            return originalHearing.Participants.Where(p => participants.TrueForAll(rp => rp.Id != p.Id))
                .Select(x => x).ToList();
        }

        private async Task UpdateJudiciaryParticipants(Guid hearingId, List<JudiciaryParticipantRequest> judiciaryParticipants,
            HearingDetailsResponse originalHearing)
        {
            var request = MapUpdateJudiciaryParticipantsRequestV2(judiciaryParticipants, originalHearing);
            
            // Due to booking api's domain restrictions for removing participants, we have to update judges differently
            var oldJudge = originalHearing.JudiciaryParticipants.Find(ojp => ojp.RoleCode == JudiciaryParticipantHearingRoleCode.Judge.ToString());
            var newJudge = judiciaryParticipants.Find(njp => njp.Role == JudiciaryParticipantHearingRoleCode.Judge.ToString());
            if (oldJudge?.PersonalCode != newJudge?.PersonalCode && newJudge != null)
            {
                await _bookingsApiClient.ReassignJudiciaryJudgeAsync(hearingId, new ReassignJudiciaryJudgeRequest
                {
                    DisplayName = newJudge.DisplayName,
                    PersonalCode = newJudge.PersonalCode,
                    OptionalContactEmail = newJudge.OptionalContactEmail,
                    InterpreterLanguageCode = newJudge.InterpreterLanguageCode
                });
            }

            foreach (var removedJohPersonalCode in request.RemovedJudiciaryParticipantPersonalCodes)
            {
                var removedJoh = originalHearing.JudiciaryParticipants.Find(p => p.PersonalCode == removedJohPersonalCode);
                if (removedJoh.RoleCode == JudiciaryParticipantHearingRoleCode.Judge.ToString())
                {
                    // Judges are re-assigned instead of removed or added
                    continue;
                }
                
                await _bookingsApiClient.RemoveJudiciaryParticipantFromHearingAsync(hearingId, removedJoh.PersonalCode);
            }

            var johsToAdd = request.NewJudiciaryParticipants
                .Select(jp => new BookingsApi.Contract.V2.Requests.JudiciaryParticipantRequest()
                {
                    DisplayName = jp.DisplayName,
                    PersonalCode = jp.PersonalCode,
                    HearingRoleCode = jp.HearingRoleCode == JudiciaryParticipantHearingRoleCode.Judge ? JudiciaryParticipantHearingRoleCode.Judge
                        : JudiciaryParticipantHearingRoleCode.PanelMember,
                    InterpreterLanguageCode = jp.InterpreterLanguageCode
                })
                // Judges are re-assigned instead of removed or added
                .Where(jp => jp.HearingRoleCode != JudiciaryParticipantHearingRoleCode.Judge)
                .ToList();
         
            if (johsToAdd.Count != 0)
            {
                await _bookingsApiClient.AddJudiciaryParticipantsToHearingAsync(hearingId, johsToAdd);
            }

            foreach (var joh in request.ExistingJudiciaryParticipants)
            {
                var roleCode = joh.HearingRoleCode == JudiciaryParticipantHearingRoleCode.Judge ? JudiciaryParticipantHearingRoleCode.Judge
                    : JudiciaryParticipantHearingRoleCode.PanelMember;
                
                await _bookingsApiClient.UpdateJudiciaryParticipantAsync(hearingId, joh.PersonalCode,
                    new UpdateJudiciaryParticipantRequest
                    {
                        DisplayName = joh.DisplayName, 
                        HearingRoleCode = roleCode, 
                        InterpreterLanguageCode = joh.InterpreterLanguageCode
                    });
            }
        }

        private static UpdateJudiciaryParticipantsRequest MapUpdateJudiciaryParticipantsRequestV2(List<JudiciaryParticipantRequest> judiciaryParticipants,
            HearingDetailsResponse originalHearing, bool skipUnchangedParticipants = true, HearingChanges hearingChanges = null)
        {
            var request = new UpdateJudiciaryParticipantsRequest();
            
            // keep the order of removal first. this will allow admin web to change judiciary judges post booking
            var removedJohs = originalHearing.JudiciaryParticipants.Where(ojp =>
                judiciaryParticipants.TrueForAll(jp => jp.PersonalCode != ojp.PersonalCode)).ToList();
            if (hearingChanges != null)
            {
                removedJohs = new List<JudiciaryParticipantResponse>();
                
                if (hearingChanges.RemovedJudiciaryParticipants.Exists(x => x.RoleCode == JudiciaryParticipantHearingRoleCode.Judge.ToString()))
                {
                    // If the judge is removed as part of the request, then they are being reassigned, so need to remove the existing judge for this hearing regardless
                    var existingJudge = originalHearing.JudiciaryParticipants.First(x => x.RoleCode == JudiciaryParticipantHearingRoleCode.Judge.ToString());
                    removedJohs.Add(existingJudge);
                }
                else
                {
                    // Only remove judiciary participants that have been explicitly removed as part of this request, if they exist on this hearing
                    removedJohs = originalHearing.JudiciaryParticipants
                        .Where(ojp => hearingChanges.RemovedJudiciaryParticipants
                            .Exists(jp => jp.PersonalCode == ojp.PersonalCode))
                        .ToList();
                }
            }
            foreach (var removedJoh in removedJohs)
            {
                request.RemovedJudiciaryParticipantPersonalCodes.Add(removedJoh.PersonalCode);
            }
            
            var newJohs = judiciaryParticipants.Where(jp =>
                !originalHearing.JudiciaryParticipants.Exists(ojp => ojp.PersonalCode == jp.PersonalCode)).ToList();
            if (hearingChanges != null)
            {
                // Only add judiciary participants that have been explicitly added as part of this request
                newJohs = hearingChanges.NewJudiciaryParticipants.ToList();
            }

            var newJohRequest = newJohs.Select(jp =>
            {
                var roleCode = Enum.Parse<JudiciaryParticipantHearingRoleCode>(jp.Role);
                return new BookingsApi.Contract.V2.Requests.JudiciaryParticipantRequest()
                {
                    DisplayName = jp.DisplayName,
                    PersonalCode = jp.PersonalCode,
                    HearingRoleCode = roleCode,
                    ContactEmail = jp.OptionalContactEmail,
                    InterpreterLanguageCode = jp.InterpreterLanguageCode
                };
            }).ToList();
            if (newJohRequest.Count != 0)
            {
                var johsToAdd = newJohRequest
                    .ToList();

                if (johsToAdd.Count != 0)
                {
                    var newParticipants = johsToAdd
                        .Select(x => new BookingsApi.Contract.V2.Requests.JudiciaryParticipantRequest
                        {
                            ContactEmail = x.ContactEmail,
                            DisplayName = x.DisplayName,
                            PersonalCode = x.PersonalCode,
                            HearingRoleCode = x.HearingRoleCode == JudiciaryParticipantHearingRoleCode.Judge ? JudiciaryParticipantHearingRoleCode.Judge
                                : JudiciaryParticipantHearingRoleCode.PanelMember,
                            ContactTelephone = x.ContactTelephone,
                            InterpreterLanguageCode = x.InterpreterLanguageCode
                        })
                        .ToList();
                    
                    request.NewJudiciaryParticipants.AddRange(newParticipants);
                }
            }
            
            request.ExistingJudiciaryParticipants = MapExistingJudiciaryParticipants(judiciaryParticipants, 
                originalHearing, 
                skipUnchangedParticipants: skipUnchangedParticipants,
                removedJudiciaryParticipantPersonalCodes: hearingChanges != null ? request.RemovedJudiciaryParticipantPersonalCodes : null);

            return request;
        }

        private static List<EditableUpdateJudiciaryParticipantRequest> MapExistingJudiciaryParticipants(IEnumerable<JudiciaryParticipantRequest> judiciaryParticipantsToUpdate,
            HearingDetailsResponse originalHearing, bool skipUnchangedParticipants = true, List<string> removedJudiciaryParticipantPersonalCodes = null)
        {
            // get existing judiciary participants based on the personal code being present in the original hearing
            var existingJohs = judiciaryParticipantsToUpdate.Where(jp =>
                originalHearing.JudiciaryParticipants.Exists(ojp => ojp.PersonalCode == jp.PersonalCode)).ToList();

            if (removedJudiciaryParticipantPersonalCodes != null)
            {
                // Get the existing judiciary participants on this hearing
                existingJohs = originalHearing.JudiciaryParticipants
                    .Select(jp => new JudiciaryParticipantRequest
                    {
                        PersonalCode = jp.PersonalCode,
                        Role = jp.RoleCode.ToString(),
                        DisplayName = jp.DisplayName,
                        OptionalContactTelephone = jp.OptionalContactTelephone,
                        OptionalContactEmail = jp.OptionalContactEmail,
                        InterpreterLanguageCode = jp.InterpreterLanguage?.Code
                    })
                    .ToList();
                
                // Exclude any that have been explicitly removed as part of this request
                existingJohs = existingJohs
                    .Where(e => removedJudiciaryParticipantPersonalCodes
                        .TrueForAll(d => d != e.PersonalCode))
                    .ToList();
            }

            var existingJudiciaryParticipants = new List<EditableUpdateJudiciaryParticipantRequest>();
            
            foreach (var joh in existingJohs)
            {
                if (skipUnchangedParticipants)
                {
                    // Only update the joh if their details have changed
                    var originalJoh = originalHearing.JudiciaryParticipants.Find(x => x.PersonalCode == joh.PersonalCode);
                    if (joh.DisplayName == originalJoh.DisplayName &&
                        joh.Role == originalJoh.RoleCode &&
                        joh.InterpreterLanguageCode == originalJoh.InterpreterLanguage?.Code)
                    {
                        continue;
                    }
                }
                
                var roleCode = Enum.Parse<JudiciaryParticipantHearingRoleCode>(joh.Role);
                existingJudiciaryParticipants.Add(new EditableUpdateJudiciaryParticipantRequest
                {
                    PersonalCode = joh.PersonalCode,
                    DisplayName = joh.DisplayName,
                    HearingRoleCode = roleCode == JudiciaryParticipantHearingRoleCode.Judge ? JudiciaryParticipantHearingRoleCode.Judge
                        : JudiciaryParticipantHearingRoleCode.PanelMember,
                    InterpreterLanguageCode = joh.InterpreterLanguageCode
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
                var response = await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId);
                ICollection<HearingDetailsResponseV2> groupedHearings = null;
                if (response.GroupId != null)
                {
                    groupedHearings = await _bookingsApiClient.GetHearingsByGroupIdV2Async(response.GroupId.Value);
                }
                var hearingResponse = response.Map(groupedHearings);
                
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
                _logger.LogDebug("Hearing {HearingId} is booked. Polling for the status in BookingsApi", hearingId);
                var response = await GetHearing(hearingId);
                var participantsNeedVhAccounts = ParticipantsNeedVhAccounts(response.Participants);
                var accountsStillNeedCreating = participantsNeedVhAccounts.Any(x => x.ContactEmail == x.Username);
                var isMultiDay = response.GroupId != null;
                if (isMultiDay)
                {
                    // Users are created as part of the clone process, so don't wait for them here
                    accountsStillNeedCreating = false;
                }
                
                ConferenceDetailsResponse conferenceDetailsResponse;

                if (response.Status != BookingStatus.Created || accountsStillNeedCreating)
                {
                    return Ok(new UpdateBookingStatusResponse { Success = false, Message = errorMessage });
                }

                try
                {
                    conferenceDetailsResponse =
                        await _conferenceDetailsService.GetConferenceDetailsByHearingId(hearingId);
                    if (!conferenceDetailsResponse.HasValidMeetingRoom())
                    {
                        return Ok(new UpdateBookingStatusResponse { Success = false, Message = errorMessage });
                    }
                }
                catch (VideoApiException e)
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
                if (ex is BookingsApiException e)
                {
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
            try
            {
                await _bookingsApiClient.FailBookingAsync(hearingId);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Failed to update the failed status for a hearing - hearingId: {HearingId}", hearingId);
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

        private static IEnumerable<ParticipantResponse> ParticipantsNeedVhAccounts(List<ParticipantResponse> allParticipants)
        {
            var participantsNeedVhAccounts = allParticipants.Where(x => x.UserRoleName == RoleNames.Individual || x.UserRoleName == RoleNames.Representative);
            
            return participantsNeedVhAccounts;
        }
    }
}