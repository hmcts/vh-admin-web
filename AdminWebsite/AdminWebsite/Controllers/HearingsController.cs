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
using AdminWebsite.Services.Models;
using BookingsApi.Client;
using BookingsApi.Contract.Configuration;
using BookingsApi.Contract.Enums;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;

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
        private readonly IUserAccountService _userAccountService;
        private readonly IUserIdentity _userIdentity;
        private static readonly int startingSoonMinutesThreshold = 30;

        /// <summary>
        ///     Instantiates the controller
        /// </summary>
#pragma warning disable S107
        public HearingsController(IBookingsApiClient bookingsApiClient, IUserIdentity userIdentity,
            IUserAccountService userAccountService, IValidator<EditHearingRequest> editHearingRequestValidator,
            ILogger<HearingsController> logger, IHearingsService hearingsService,
            IConferenceDetailsService conferenceDetailsService, IFeatureToggles featureToggles)
        {
            _bookingsApiClient = bookingsApiClient;
            _userIdentity = userIdentity;
            _userAccountService = userAccountService;
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
            var usernameAdIdDict = new Dictionary<string, User>();
            try
            {
                List<ParticipantRequest> nonJudgeParticipants;
                var ejudFeatureFlag = await _bookingsApiClient.GetFeatureFlagAsync(nameof(FeatureFlags.EJudFeature));
                var judgeExists = request.BookingDetails.Participants?.Any(x => x.HearingRoleName == RoleNames.Judge) ?? false;
                // Disable to create AAD accounts for Panel members and wingers when ejudFeature is 'OFF'
                if (ejudFeatureFlag)
                {
                    nonJudgeParticipants = newBookingRequest.Participants
                        .Where(p => p.HearingRoleName != RoleNames.Judge)
                        .Where(p => p.HearingRoleName != RoleNames.PanelMember)
                        .Where(p => p.HearingRoleName != RoleNames.Winger).ToList();
                }
                else
                {
                    nonJudgeParticipants = newBookingRequest.Participants
                        .Where(p => p.HearingRoleName != RoleNames.Judge).ToList();
                }

                await PopulateUserIdsAndUsernames(nonJudgeParticipants, usernameAdIdDict);
                if (newBookingRequest.Endpoints != null && newBookingRequest.Endpoints.Any())
                {
                    var endpointsWithDa = newBookingRequest.Endpoints
                        .Where(x => !string.IsNullOrWhiteSpace(x.DefenceAdvocateUsername))
                        .ToList();
                    _hearingsService.AssignEndpointDefenceAdvocates(endpointsWithDa,
                        newBookingRequest.Participants.AsReadOnly());
                }

                newBookingRequest.CreatedBy = _userIdentity.GetUserIdentityName();
                _logger.LogInformation("BookNewHearing - Attempting to send booking request to Booking API");
                var hearingDetailsResponse = await _bookingsApiClient.BookNewHearingAsync(newBookingRequest);
                _logger.LogInformation("BookNewHearing - Successfully booked hearing {Hearing}",
                    hearingDetailsResponse.Id);
                
                if(_featureToggles.BookAndConfirmToggle() && judgeExists)
                    await ConfirmHearing(hearingDetailsResponse.Id);

                _logger.LogInformation("BookNewHearing - Sending email notification to the participants");
                await _hearingsService.SendNewUserEmailParticipants(hearingDetailsResponse, usernameAdIdDict);
                _logger.LogInformation("BookNewHearing - Successfully sent emails to participants- {Hearing}",
                    hearingDetailsResponse.Id);
                _logger.LogInformation("BookNewHearing - Attempting assign participants to the correct group");
                await _hearingsService.AssignParticipantToCorrectGroups(hearingDetailsResponse, usernameAdIdDict);
                _logger.LogInformation("BookNewHearing - Successfully assigned participants to the correct group");

                if (request.IsMultiDay)
                {
                    await SendMultiDayHearingConfirmationEmail(request, hearingDetailsResponse);
                }
                else
                {
                    await _hearingsService.NewHearingSendConfirmation(hearingDetailsResponse);
                }

                return Created("", hearingDetailsResponse);
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e,
                    "BookNewHearing - There was a problem saving the booking. Status Code {StatusCode} - Message {Message}",
                    e.StatusCode, e.Response);
                if (e.StatusCode == (int)HttpStatusCode.BadRequest) return BadRequest(e.Response);
                throw;
            }
            catch (Exception e)
            {
                _logger.LogError(e, "BookNewHearing - Failed to save hearing - {Message} -  for request: {RequestBody}",
                    e.Message, JsonConvert.SerializeObject(newBookingRequest));
                throw;
            }
        }

        private async Task ConfirmHearing(Guid hearingIdOrGroupId, bool clonedRequest = false)
        {
            var updateBookingStatusRequest = new UpdateBookingStatusRequest
            {
                Status = BookingsApi.Contract.Requests.Enums.UpdateBookingStatus.Created,
            };

            if (clonedRequest)
            {
                var groupedHearings = await _bookingsApiClient.GetHearingsByGroupIdAsync(hearingIdOrGroupId);
                var unConfirmedHearingsList = groupedHearings.Where(b => b.Status != BookingStatus.Created);
                var unConfirmedHearingIds = unConfirmedHearingsList.Select(h => h.Id).ToList();
                
                await UpdateMultipleBookingStatuses(unConfirmedHearingIds, updateBookingStatusRequest);
            }
            else
            {
                await UpdateBookingStatus(hearingIdOrGroupId, updateBookingStatusRequest);
            }
        }
        
        private async Task UpdateMultipleBookingStatuses(IReadOnlyCollection<Guid> hearingIds, UpdateBookingStatusRequest updateBookingStatusRequest)
        {
            var batchSize = 20;
            var batchCount = (int)Math.Ceiling((double)hearingIds.Count / batchSize);
                
            for (int i = 0; i < batchCount; i++)
            {
                var hearingIdsToUpdate = hearingIds.Skip(i * batchSize).Take(batchSize);

                var updateBookingStatusTasks = hearingIdsToUpdate.Select(hearingId => UpdateBookingStatus(hearingId, updateBookingStatusRequest)).ToList();

                await Task.WhenAll(updateBookingStatusTasks);
            }
        }

        private async Task SendMultiDayHearingConfirmationEmail(BookHearingRequest request,
            HearingDetailsResponse hearingDetailsResponse)
        {
            IList<DateTime> listOfDates;
            int totalDays;

            if (request.MultiHearingDetails.HearingDates != null && request.MultiHearingDetails.HearingDates.Any())
            {
                listOfDates = request.MultiHearingDetails.HearingDates;
                totalDays = listOfDates.Select(x => x.DayOfYear).Distinct().Count();
            }
            else
            {
                listOfDates = DateListMapper.GetListOfWorkingDates(request.MultiHearingDetails.StartDate,
                    request.MultiHearingDetails.EndDate);
                totalDays = listOfDates.Select(x => x.DayOfYear).Distinct().Count() + 1; // include start date
            }


            await _hearingsService.SendMultiDayHearingConfirmationEmail(hearingDetailsResponse, totalDays);
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

            var hearingDates = hearingRequest.HearingDates != null && hearingRequest.HearingDates.Any() ? hearingRequest.HearingDates.Skip(1).ToList() : DateListMapper.GetListOfWorkingDates(hearingRequest.StartDate, hearingRequest.EndDate);

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
                
                var hearing = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
                var judgeExists =  hearing.Participants.Any(x => x.HearingRoleName == RoleNames.Judge);
                if(_featureToggles.BookAndConfirmToggle() && judgeExists)
                    await ConfirmHearing(hearingId, true);

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
            var usernameAdIdDict = new Dictionary<string, User>();
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
                originalHearing = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
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
                    !_hearingsService.IsAddingOrRemovingStaffMember(request, originalHearing) && 
                    !_hearingsService.IsUpdatingJudge(request, originalHearing))
                {
                    var errorMessage =
                        $"You can't edit a confirmed hearing [{hearingId}] within {startingSoonMinutesThreshold} minutes of it starting";
                    _logger.LogWarning(errorMessage);
                    ModelState.AddModelError(nameof(hearingId), errorMessage);
                    return BadRequest(ModelState);
                }

                var judgeExistsInRequest = request?.Participants?.Any(p => p.HearingRoleName == RoleNames.Judge) ?? false;
                if (originalHearing.Status == BookingStatus.Created && !judgeExistsInRequest)
                {
                    var errorMessage = "You can't edit a confirmed hearing if the update removes the judge";
                    _logger.LogWarning(errorMessage);
                    ModelState.AddModelError(nameof(hearingId), errorMessage);
                    return BadRequest(ModelState);
                }
                //Save hearing details
                var updateHearingRequest =
                    HearingUpdateRequestMapper.MapTo(request, _userIdentity.GetUserIdentityName());
                await _bookingsApiClient.UpdateHearingDetailsAsync(hearingId, updateHearingRequest);

                var existingParticipants = new List<UpdateParticipantRequest>();
                var newParticipants = new List<ParticipantRequest>();
                var removedParticipantIds = originalHearing.Participants.Where(p => request.Participants.All(rp => rp.Id != p.Id)).Select(x => x.Id).ToList();

                foreach (var participant in request.Participants)
                {
                    if (!participant.Id.HasValue)
                    {
                        if (await _hearingsService.ProcessNewParticipant(hearingId, participant,
                            removedParticipantIds,
                            originalHearing,
                            usernameAdIdDict) is { } newParticipant)
                        {
                            newParticipants.Add(newParticipant);
                        }
                    }
                    else
                    {
                        var existingParticipant =
                            originalHearing.Participants.FirstOrDefault(p => p.Id.Equals(participant.Id));
                        if (existingParticipant == null || string.IsNullOrEmpty(existingParticipant.UserRoleName))
                        {
                            continue;
                        }

                        var updateParticipantRequest = UpdateParticipantRequestMapper.MapTo(participant);
                        existingParticipants.Add(updateParticipantRequest);
                    }
                }

                var linkedParticipants = new List<LinkedParticipantRequest>();
                var participantsWithLinks = request.Participants.Where(x => x.LinkedParticipants.Any()
                 && !removedParticipantIds.Contains(x.LinkedParticipants[0].LinkedId) && !removedParticipantIds.Contains(x.LinkedParticipants[0].ParticipantId)).ToList();

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
                    if (participantWithLinks.Id.HasValue && existingParticipants.SingleOrDefault(x => x.ParticipantId == participantWithLinks.Id) != null)
                    {
                        // Is the linked participant an existing participant?
                        var secondaryParticipantInLinkContactEmail = originalHearing.Participants
                            .SingleOrDefault(x => x.Id == participantWithLinks.LinkedParticipants[0].LinkedId)?
                            .ContactEmail ?? newParticipants
                            .SingleOrDefault(x => x.ContactEmail == participantWithLinks.LinkedParticipants[0].LinkedParticipantContactEmail)
                            ?.ContactEmail;

                        // If the linked participant isn't an existing participant it will be a newly added participant                        

                        linkedParticipantRequest.LinkedParticipantContactEmail = secondaryParticipantInLinkContactEmail;

                        // If the linked participant is an already existing user they will be mapped twice, so we remove them here.
                        var secondaryParticipantInLinkIndex = participantsWithLinks.FindIndex(x => x.ContactEmail == secondaryParticipantInLinkContactEmail);
                        if (secondaryParticipantInLinkIndex >= 0)
                            participantsWithLinks.RemoveAt(secondaryParticipantInLinkIndex);
                    }

                    linkedParticipants.Add(linkedParticipantRequest);
                }

                await _hearingsService.ProcessParticipants(hearingId, existingParticipants, newParticipants, removedParticipantIds.ToList(), linkedParticipants.ToList());

                // endpoints
                await _hearingsService.ProcessEndpoints(hearingId, request, originalHearing, newParticipants);

                var updatedHearing = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
                _logger.LogDebug("Attempting assign participants to the correct group");
                await _hearingsService.AssignParticipantToCorrectGroups(updatedHearing, usernameAdIdDict);
                _logger.LogDebug("Successfully assigned participants to the correct group");

                // Send a notification email to newly created participants
                var newJudgeHasBeenAdded = newParticipants.Any(e => e.HearingRoleName == RoleNames.Judge);
                var newParticipantEmails = newParticipants.Select(p => p.ContactEmail).ToList();
                await SendEmailsToParticipantsAddedToHearing(newParticipants, updatedHearing, usernameAdIdDict, newParticipantEmails);
                
                //Does not need to be sent if new judge added - handled in SendEmailsToParticipantsAddedToHearing 
                if (updatedHearing.JudgeHasNotChangedForGenericHearing(originalHearing) && !newJudgeHasBeenAdded)
                {
                    //send when email changes
                    await SendJudgeEmailIfNeeded(updatedHearing, originalHearing);
                }
                
                await ConfirmBookingWhenJudgeAdded(originalHearing, judgeExistsInRequest);

                if (!updatedHearing.HasScheduleAmended(originalHearing)) return Ok(updatedHearing);

                var participantsForAmendment = updatedHearing.Participants
                    .Where(p => !newParticipantEmails.Contains(p.ContactEmail)).ToList();
                await _hearingsService.SendHearingUpdateEmail(originalHearing, updatedHearing,
                    participantsForAmendment);

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
        
        private async Task ConfirmBookingWhenJudgeAdded(HearingDetailsResponse orgHearing,  bool judgeExistsInRequest)
        {
            var judgeInOriginalHearing = orgHearing.Participants.Any(p => p.HearingRoleName == RoleNames.Judge);
            if (judgeExistsInRequest && !judgeInOriginalHearing && _featureToggles.BookAndConfirmToggle())
                await ConfirmHearing(orgHearing.Id);
        }

        private async Task SendJudgeEmailIfNeeded(HearingDetailsResponse updatedHearing,
            HearingDetailsResponse originalHearing)
        {
            if (updatedHearing.IsGenericHearing())
            {
                await _hearingsService.ProcessGenericEmail(updatedHearing, updatedHearing.Participants);
            }

            else if (updatedHearing.HasJudgeEmailChanged(originalHearing) && updatedHearing.Status == BookingStatus.Created)
            {
                await _hearingsService.SendJudgeConfirmationEmail(updatedHearing);
            }
        }

        private static bool IsHearingStartingSoon(HearingDetailsResponse originalHearing)
        {
            var timeToCheckHearingAgainst = DateTime.UtcNow.AddMinutes(startingSoonMinutesThreshold);
            return originalHearing.ScheduledDateTime < timeToCheckHearingAgainst;
        }

        private async Task SendEmailsToParticipantsAddedToHearing(List<ParticipantRequest> newParticipantList,
            HearingDetailsResponse updatedHearing, Dictionary<string, User> usernameAdIdDict,
            IEnumerable<string> newParticipantEmails)
        {
            if (newParticipantList.Any())
            {
                _logger.LogInformation("Sending email notification to the participants");
                await _hearingsService.SendNewUserEmailParticipants(updatedHearing, usernameAdIdDict);
                var participantsForConfirmation = updatedHearing.Participants
                    .Where(p => newParticipantEmails.Contains(p.ContactEmail)).ToList();

                await _hearingsService.EditHearingSendConfirmation(updatedHearing, participantsForConfirmation);
                _logger.LogInformation("Successfully sent emails to participants - {Hearing}", updatedHearing.Id);
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
                var hearingResponse = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
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
            var errorMessage =
                $"Failed to get the conference from video api, possibly the conference was not created or the kinly meeting room is null - hearingId: {hearingId}";
            try
            {
                var hearing = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
                var judgeExists = hearing?.Participants?.Any(p => p.HearingRoleName == RoleNames.Judge) ?? false;
                if (!judgeExists && updateBookingStatusRequest.Status == BookingsApi.Contract.Requests.Enums.UpdateBookingStatus.Created)
                    return BadRequest("This hearing has no judge");
                
                _logger.LogDebug("Attempting to update hearing {Hearing} to booking status {BookingStatus}", hearingId, updateBookingStatusRequest.Status);

                updateBookingStatusRequest.UpdatedBy = _userIdentity.GetUserIdentityName();
                await _bookingsApiClient.UpdateBookingStatusAsync(hearingId, updateBookingStatusRequest);

                _logger.LogDebug("Updated hearing {Hearing} to booking status {BookingStatus}", hearingId, updateBookingStatusRequest.Status);

                if (updateBookingStatusRequest.Status != BookingsApi.Contract.Requests.Enums.UpdateBookingStatus.Created)
                    return Ok(new UpdateBookingStatusResponse { Success = true });

                try
                {
                    _logger.LogDebug("Hearing {Hearing} is confirmed. Polling for Conference in VideoApi", hearingId);
                    var conferenceDetailsResponse = await _conferenceDetailsService.GetConferenceDetailsByHearingIdWithRetry(hearingId, errorMessage);
                    _logger.LogInformation("Found conference for hearing {Hearing}", hearingId);

                    if (conferenceDetailsResponse.HasValidMeetingRoom())
                    {
                        //if toggle off - send Hearing Reminder Email
                        if (!_featureToggles.BookAndConfirmToggle())
                        {
                            _logger.LogInformation("Sending a reminder email for hearing {Hearing}", hearingId);
                            await _hearingsService.SendHearingReminderEmail(hearing);
                        }
                        return Ok(new UpdateBookingStatusResponse
                        {
                            Success = true,
                            TelephoneConferenceId = conferenceDetailsResponse.MeetingRoom.TelephoneConferenceId
                        });
                    }
                    else
                    {
                        await UpdateFailedBookingStatus(hearingId);
                        return Ok(new UpdateBookingStatusResponse { Success = false, Message = errorMessage });
                    }
                }
                catch (VideoApiException ex)
                {
                    _logger.LogError(ex, "Failed to confirm a hearing. {ErrorMessage}", errorMessage);
                    _logger.LogError("There was an unknown error for hearing {Hearing}. Updating status to failed",
                    hearingId);

                    // Set the booking status to failed as the video api failed
                    await UpdateFailedBookingStatus(hearingId);

                    return Ok(new UpdateBookingStatusResponse { Success = false, Message = errorMessage });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "There was an unknown error updating status for hearing {Hearing}", hearingId);
                if (updateBookingStatusRequest.Status == BookingsApi.Contract.Requests.Enums.UpdateBookingStatus.Created)
                {
                    // Set the booking status to failed as the video api failed
                    await UpdateFailedBookingStatus(hearingId);

                    return Ok(new UpdateBookingStatusResponse { Success = false, Message = errorMessage });
                }
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

        private async Task UpdateFailedBookingStatus(Guid hearingId)
        {
            await _bookingsApiClient.UpdateBookingStatusAsync(hearingId,
                    new UpdateBookingStatusRequest
                    {
                        Status = BookingsApi.Contract.Requests.Enums.UpdateBookingStatus.Failed,
                        UpdatedBy = "System",
                        CancelReason = string.Empty
                    });
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
                var conferenceDetailsResponse = await _conferenceDetailsService.GetConferenceDetailsByHearingId(hearingId);

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

        private async Task PopulateUserIdsAndUsernames(IList<ParticipantRequest> participants,
            Dictionary<string, User> usernameAdIdDict)
        {
            _logger.LogDebug("Assigning HMCTS usernames for participants");
            foreach (var participant in participants)
            {
                User user = null;

                if (!string.IsNullOrWhiteSpace(participant.Username))
                {
                    // get user
                    _logger.LogDebug(
                        "Username provided in booking for participant {Email}. Getting id for username {Username}",
                        participant.ContactEmail, participant.Username);
                    var adUserId = await _userAccountService.GetAdUserIdForUsername(participant.Username);

                    if (!string.IsNullOrEmpty(adUserId)) user = new User { UserId = adUserId };
                    else participant.Username = "";
                }

                // set the participant username according to AD

                if (string.IsNullOrWhiteSpace(participant.Username))
                {
                    _logger.LogDebug(
                        "No username provided in booking for participant {Email}. Checking AD by contact email",
                        participant.ContactEmail);
                    user = await _userAccountService.UpdateParticipantUsername(participant);
                    participant.Username = user.UserName;
                }

                // username's participant will be set by this point
                usernameAdIdDict[participant.Username!] = user;
            }
        }
    }
}
