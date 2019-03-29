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
                    hearingRequest.Participants = await UpdateParticipantsUsername(hearingRequest.Participants);
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
                var response = await _bookingsApiClient.UpdateHearingDetailsAsync(hearingId, updateHearingRequest);

                foreach (var participant in editHearingRequest.Participants)
                {
                    if(!participant.Id.HasValue)
                    {
                        //new record
                    }
                    else
                    {
                        var existingParticipant = hearing.Participants.FirstOrDefault(p => p.Id.Equals(participant.Id));
                        if(existingParticipant == null)
                        {
                            //What do we do here ?
                        }
                        else
                        {
                            //Uodate here
                        }
                    }
                }

                //Delete the remaining participants

                //Update existing participants
                foreach (var participant in hearing.Participants)
                {
                    
                }

                

                //Delete existing participants

                //Add new participants



                return Ok();
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

        private async Task<List<ParticipantRequest>> UpdateParticipantsUsername(List<ParticipantRequest> participants)
        {
            foreach (var participant in participants)
            {
                if (participant.Case_role_name == "Judge") continue;
                //// create user in AD if users email does not exist in AD.
                var userProfile = await CheckUserExistsInAD(participant.Contact_email);
                if (userProfile == null)
                {
                    // create the user in AD.
                    var createdNewUser = await CreateNewUserInAD(participant);
                    if (createdNewUser != null)
                    {
                        participant.Username = createdNewUser.Username;
                    // Add user to user group.
                    var addUserToGroupRequest = new AddUserToGroupRequest()
                    {
                        User_id = createdNewUser.User_id,
                        Group_name = "External"
                    };
                    await _userApiClient.AddUserToGroupAsync(addUserToGroupRequest);

                    if (participant.Hearing_role_name == "Solicitor")
                        {
                            addUserToGroupRequest = new AddUserToGroupRequest()
                            {
                                User_id = createdNewUser.User_id,
                                Group_name = "VirtualRoomProfessionalUser"
                            };
                            await _userApiClient.AddUserToGroupAsync(addUserToGroupRequest);
                        }
                    }
                }
                else
                {
                    participant.Username = userProfile.User_name;
                }
            }
            return participants;
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

    }
}