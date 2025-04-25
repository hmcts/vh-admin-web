using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Attributes;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Exceptions;
using AdminWebsite.Extensions;
using AdminWebsite.Extensions.Logging;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V2.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using HearingDetailsResponse = AdminWebsite.Contracts.Responses.HearingDetailsResponse;
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
            try
            {
                var createdBy = _userIdentity.GetUserIdentityName();

                var response = await _hearingsService.BookNewHearing(request, createdBy);
                
                return Created("", response);
            }
            catch (BookingsApiException e)
            {
                _logger.LogBookNewHearingError(e.StatusCode, e.Response, e);
                if (e.StatusCode == (int)HttpStatusCode.BadRequest)
                {
                    var typedException = e as BookingsApiException<ValidationProblemDetails>;
                    return ValidationProblem(typedException!.Result);
                }
                return StatusCode(500, e.Message);
            }
            catch (Exception e)
            {
                _logger.LogBookNewHearingFailed(e.Message, JsonConvert.SerializeObject(request), e);
                return StatusCode(500, e.Message);
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
                _logger.LogRebookHearingError(e.StatusCode, e.Response, e);
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
            try
            {
                await _hearingsService.CloneHearing(hearingId, hearingRequest);

                var groupedHearings = await _bookingsApiClient.GetHearingsByGroupIdV2Async(hearingId);

                var conferenceStatusToGet = groupedHearings.Where(x => x.Participants?
                    .Exists(gh => gh.HearingRoleName == RoleNames.Judge) ?? false);
                var tasks = conferenceStatusToGet.Select(x => GetHearingConferenceStatus(x.Id)).ToList();
                await Task.WhenAll(tasks);

                return NoContent();
            }
            catch (BookingsApiException e)
            {
                _logger.LogCloneHearingError(e.StatusCode, e.Response, e);
                if (e.StatusCode == (int)HttpStatusCode.BadRequest) return BadRequest(e.Response);
                return StatusCode(500, e.Message);
            }
            catch (ServiceException e)
            {
                return BadRequest(e.Message);
            }
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
                _logger.LogNoHearingIdToEdit();
                ModelState.AddModelError(nameof(hearingId), $"Please provide a valid {nameof(hearingId)}");
                return ValidationProblem(ModelState);
            }

            _logger.LogAttemptingToEditHearing(hearingId);
            HearingDetailsResponse originalHearing;
            try
            {
                originalHearing = (await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId)).Map();
            }
            catch (BookingsApiException e)
            {
                _logger.LogFailedToGetHearing(hearingId, e.StatusCode, e.Response);
                if (e.StatusCode != (int)HttpStatusCode.NotFound) throw;
                return NotFound($"No hearing with id found [{hearingId}]");
            }
            try
            {
                var updatedHearing = (await _bookingsApiClient.GetHearingDetailsByIdV2Async(hearingId)).Map();
                var updatedBy = _userIdentity.GetUserIdentityName();
                
                await _hearingsService.UpdateHearing(request, hearingId, updatedHearing, updatedBy);

                if (updatedHearing.Status == BookingStatus.Failed) return Ok(updatedHearing);
                if (!updatedHearing.HasScheduleAmended(originalHearing)) return Ok(updatedHearing);
                return Ok(updatedHearing);
            }
            catch (BookingsApiException e)
            {
                _logger.LogFailedToEditHearing(hearingId, e.StatusCode, e.Response);
                
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

                var updatedBy = _userIdentity.GetUserIdentityName();
                await _hearingsService.UpdateMultiDayHearing(request, hearing.Id, hearing.GroupId.Value, updatedBy);

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

                _logger.LogUnexpectedErrorEditingMultiDayHearing(e);
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

                var updatedBy = _userIdentity.GetUserIdentityName();
                await _hearingsService.CancelMultiDayHearing(request, hearing.Id, hearing.GroupId.Value, updatedBy);
                
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
                
                _logger.LogUnexpectedErrorCancellingMultiDayHearing(e);
                return StatusCode(500, e.Message);
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
                _logger.LogPollingHearingStatus(hearingId);
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
                    _logger.LogFailedToGetBookingCreatedStatusError(hearingId, e);
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
                _logger.LogFailedToGetBookingCreatedStatusError(hearingId, e);
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

                _logger.LogUpdatedHearingStatus(hearingId, BookingStatus.Cancelled.ToString());
                return Ok(new UpdateBookingStatusResponse { Success = true });
            }
            catch (Exception ex)
            {
                _logger.LogUnknownErrorUpdatingHearingStatus(hearingId, ex);
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
                _logger.LogFailedToUpdateFailedStatus(hearingId, e);
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