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
using AdminWebsite.Models;
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
                originalHearing = (await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId)).Map();
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
                var updatedHearing = (await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId)).Map();

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
                var hearing = (await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId)).Map();

                if (hearing.GroupId == null)
                {
                    ModelState.AddModelError(nameof(hearingId), $"Hearing is not multi-day");
                    return ValidationProblem(ModelState);
                }

                await UpdateMultiDayHearing(request, hearing.Id, hearing.GroupId.Value);

                var updatedHearing = (await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId)).Map();
            
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
                var hearing = (await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId)).Map();

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
                
            var updatedBy = _userIdentity.GetUserIdentityName();
            
            var bookingsApiRequest = UpdateHearingsInGroupRequestMapper.Map(
                hearingsToUpdate, 
                hearingId, 
                request, 
                updatedBy);

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
            var request = UpdateHearingParticipantsRequestV2Mapper.Map(hearingId, participants, originalHearing);

            if (participants.Count != 0 || request.RemovedParticipantIds.Count != 0)
                await _hearingsService.ProcessParticipantsV2(hearingId, request.ExistingParticipants, request.NewParticipants, request.RemovedParticipantIds, request.LinkedParticipants);
            
            await _hearingsService.ProcessEndpoints(hearingId, endpoints, originalHearing, new List<IParticipantRequest>(request.NewParticipants));
        }

        private async Task UpdateJudiciaryParticipants(Guid hearingId, List<JudiciaryParticipantRequest> judiciaryParticipants,
            HearingDetailsResponse originalHearing)
        {
            var request = UpdateJudiciaryParticipantsRequestMapper.Map(judiciaryParticipants, originalHearing);
            
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
                var response = (await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId)).Map();
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