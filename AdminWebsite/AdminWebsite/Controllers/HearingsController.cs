using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.UserAPI.Client;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

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
        private readonly IUserApiClient _userApiClient;


        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public HearingsController(IBookingsApiClient bookingsApiClient, IUserIdentity userIdentity,  IUserApiClient userApiClient)
        {
            _bookingsApiClient = bookingsApiClient;
            _userIdentity = userIdentity;
            _userApiClient = userApiClient;
        }

        /// <summary>
        /// Create a hearing
        /// </summary>
        /// <param name="hearingRequest">Hearing Request object</param>
        /// <returns>VideoHearingId</returns>
        [HttpPost]
        [SwaggerOperation(OperationId = "BookNewHearing")]
        [ProducesResponseType(typeof(HearingDetailsResponse), (int)HttpStatusCode.Created)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<HearingDetailsResponse>> Post([FromBody] BookNewHearingRequest hearingRequest)
        {
            try
            {
                if (hearingRequest.Participants != null)
                {
                    foreach (var participant in hearingRequest.Participants)
                    {
                        if (participant.Case_role_name == "Judge") continue;

                        await UpdateParticipantUsername(participant);
                    }
                }

                var hearingDetailsResponse = await _bookingsApiClient.BookNewHearingAsync(hearingRequest);
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
        /// <param name="editHearingRequest">Hearing Request object for edit operation</param>
        /// <returns>VideoHearingId</returns>
        [HttpPut("{hearingId}")]
        [SwaggerOperation(OperationId = "EditHearing")]
        [ProducesResponseType(typeof(HearingDetailsResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        public async Task<ActionResult<HearingDetailsResponse>> EditHearing(Guid hearingId, [FromBody] EditHearingRequest editHearingRequest)
        {
            //Validation
            if (hearingId == Guid.Empty)
            {
                ModelState.AddModelError(nameof(hearingId), $"Please provide a valid {nameof(hearingId)}");
                return BadRequest(ModelState);
            }

            if (editHearingRequest.Case == null)
            {
                ModelState.AddModelError(nameof(editHearingRequest.Case), $"Please provide valid case details");
                return BadRequest(ModelState);
            }

            if (editHearingRequest.Participants?.Any() == false)
            {
                ModelState.AddModelError("Participants", $"Please provide at least one participant");
                return BadRequest(ModelState);
            }

            var hearing = await _bookingsApiClient.GetHearingDetailsByIdAsync(hearingId);
            if (hearing == null)
            {
                return NotFound($"No hearing found for {hearingId}]");
            }
            
            try
            {
                //Save hearing details
                var updateHearingRequest = MapHearingUpdateRequest(editHearingRequest);
                var response = await _bookingsApiClient.UpdateHearingDetailsAsync(hearingId, updateHearingRequest);

                var newParticipantList = new List<ParticipantRequest>();
                
                foreach (var participant in editHearingRequest.Participants)
                {
                    if(!participant.Id.HasValue)
                    {
                        //Add a new participant

                        //Map the request except the username
                        var newParticipant = MapNewParticipantRequest(participant);
                        //Judge is manually created in AD, no need to create one
                        if (participant.CaseRoleName != "Judge")
                        {
                            //Update the request with newly created user details in AD
                            await UpdateParticipantUsername(newParticipant);
                        }
                        newParticipantList.Add(newParticipant);
                    }
                    else
                    {
                        var existingParticipant = hearing.Participants.FirstOrDefault(p => p.Id.Equals(participant.Id));
                        if(existingParticipant != null)
                        {
                            //Update participant
                            var updateParticipantRequest = MapUpdateParticipantRequest(participant);
                            await _bookingsApiClient.UpdateParticipantDetailsAsync(hearingId, participant.Id.Value, updateParticipantRequest);
                        }
                    }
                }

                //Add new participants
                if (newParticipantList.Any())
                {
                    await _bookingsApiClient.AddParticipantsToHearingAsync(hearingId, new AddParticipantsToHearingRequest()
                    {
                        Participants = newParticipantList
                    });
                }

                //Delete existing participants if the request doesn't contain any update information
                var deleteParticipantList = hearing.Participants.Where(p => editHearingRequest.Participants.Any(rp => rp.Id != p.Id.Value));
                foreach (var participantToDelete in deleteParticipantList)
                {
                    await _bookingsApiClient.RemoveParticipantFromHearingAsync(hearingId, participantToDelete.Id.Value);
                }

                return Ok();
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
                if (e.StatusCode == (int)HttpStatusCode.NoContent)
                {
                    return NoContent();
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

        private async Task<ParticipantRequest> UpdateParticipantUsername(ParticipantRequest participant)
        {
            //// create user in AD if users email does not exist in AD.
            var userProfile = await CheckUserExistsInAD(participant.Contact_email);
            if (userProfile == null)
            {
                // create the user in AD.
                await CreateNewUserInAD(participant);
            }
            else
            {
                participant.Username = userProfile.User_name;
            }
            return participant;
        }

        private async Task<UserProfile> CheckUserExistsInAD(string emailAddress)
        {
            try
            {
                return await _userApiClient.GetUserByEmailAsync(emailAddress);
            }
            catch(UserAPI.Client.UserServiceException e)
            {
                if (e.StatusCode == (int)HttpStatusCode.NotFound)
                {
                    return null;
                }
            }
            return null;
        }

        private async Task<NewUserResponse> CreateNewUserInAD(ParticipantRequest participant)
        {
            var createUserRequest = new CreateUserRequest()
            {
                First_name = participant.First_name,
                Last_name = participant.Last_name,
                Recovery_email = participant.Contact_email
            };
            var newUserResponse = await _userApiClient.CreateUserAsync(createUserRequest);
            if (newUserResponse != null)
            {
                participant.Username = newUserResponse.Username;
                // Add user to user group.
                var addUserToGroupRequest = new AddUserToGroupRequest()
                {
                    User_id = newUserResponse.User_id,
                    Group_name = "External"
                };
                await _userApiClient.AddUserToGroupAsync(addUserToGroupRequest);

                if (participant.Hearing_role_name == "Solicitor")
                {
                    addUserToGroupRequest = new AddUserToGroupRequest()
                    {
                        User_id = newUserResponse.User_id,
                        Group_name = "VirtualRoomProfessionalUser"
                    };
                    await _userApiClient.AddUserToGroupAsync(addUserToGroupRequest);
                }
            }
            return newUserResponse;
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
                    if (case_type != null)
                    {
                        typeIds.Add(case_type.Id.Value);
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
                Updated_by = User.Identity.Name,
                Cases = new List<CaseRequest>() {new CaseRequest {
                                                            Name = editHearingRequest.Case.Name,
                                                            Number = editHearingRequest.Case.Number }
                                                    }
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
                Telephone_number = participant.TelephoneNumber
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
                Solicitors_reference = participant.SolicitorsReference,
                Telephone_number = participant.TelephoneNumber,
                Title = participant.Title
            };
            return newParticipant;
        }

    }
}