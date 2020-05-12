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
        private readonly IValidator<BookNewHearingRequest> _bookNewHearingRequestValidator;
        private readonly IValidator<EditHearingRequest> _editHearingRequestValidator;
        private readonly JavaScriptEncoder _encoder;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public HearingsController(IBookingsApiClient bookingsApiClient, IUserIdentity userIdentity, IUserAccountService userAccountService,
            IValidator<BookNewHearingRequest> bookNewHearingRequestValidator, IValidator<EditHearingRequest> editHearingRequestValidator,
            JavaScriptEncoder encoder)
        {
            _bookingsApiClient = bookingsApiClient;
            _userIdentity = userIdentity;
            _userAccountService = userAccountService;
            _bookNewHearingRequestValidator = bookNewHearingRequestValidator;
            _editHearingRequestValidator = editHearingRequestValidator;
            _encoder = encoder;
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
            var result = _bookNewHearingRequestValidator.Validate(request);

            if (!result.IsValid)
            {
                ModelState.AddFluentValidationErrors(result.Errors);
                return BadRequest(ModelState);
            }

            try
            {
                if (request.Participants != null)
                {
                    foreach (var participant in request.Participants)
                    {
                        if (participant.Case_role_name == "Judge") continue;

                        await _userAccountService.UpdateParticipantUsername(participant);
                    }
                }

                request.Created_by = _userIdentity.GetUserIdentityName();
                var hearingDetailsResponse = await _bookingsApiClient.BookNewHearingAsync(request);
                return Created("", hearingDetailsResponse);
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
                            await _userAccountService.UpdateParticipantUsername(newParticipant);
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

                return Ok(await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId));
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
        /// <returns> The hearing</returns>
        [HttpGet("casenumber/{caseNumber}")]
        [SwaggerOperation(OperationId = "GetHearingsByCaseNumber")]
        [ProducesResponseType(typeof(List<HearingsForAudioFileSearchResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> GetHearingsByCaseNumberAsync(string caseNumber)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(caseNumber))
                {
                    ModelState.AddModelError(nameof(caseNumber), $"Please provide a valid {nameof(caseNumber)}");
                    return BadRequest(ModelState);
                }

                caseNumber = WebUtility.UrlDecode(caseNumber);
                
                var hearingResponse = await _bookingsApiClient.GetHearingsByCaseNumberAsync(caseNumber);
                
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
                City = participant.City,
                County = participant.County,
                House_number = participant.HouseNumber,
                Organisation_name = participant.OrganisationName,
                Postcode = participant.Postcode,
                Street = participant.Street,
                Telephone_number = participant.TelephoneNumber,
                Representee = participant.Representee,
                Reference = participant.Reference
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
                Reference = participant.Reference,
                Telephone_number = participant.TelephoneNumber,
                Title = participant.Title,
                Organisation_name = participant.OrganisationName,
                House_number = participant.HouseNumber,
                Street = participant.Street,
                City = participant.City,
                County = participant.County,
                Postcode = participant.Postcode
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
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult> UpdateBookingStatus(Guid hearingId, UpdateBookingStatusRequest updateBookingStatusRequest)
        {
            try
            {
                updateBookingStatusRequest.Updated_by = _userIdentity.GetUserIdentityName();
                await _bookingsApiClient.UpdateBookingStatusAsync(hearingId, updateBookingStatusRequest);
                return NoContent();
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
    }
}