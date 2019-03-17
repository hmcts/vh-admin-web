using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
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
        private readonly IUserApiClient _userApiClient;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public HearingsController(IBookingsApiClient bookingsApiClient, IUserApiClient userApiClient)
        {
            _bookingsApiClient = bookingsApiClient;
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
            try
            {   
                var bookingsResponse = new BookingsResponse
                {
                    Hearings = new List<BookingsByDateResponse>
                    {
                        new BookingsByDateResponse
                        {
                            Scheduled_date = new DateTime(2019, 04, 01),
                            Hearings = new List<BookingsHearingResponse>
                            {
                                new BookingsHearingResponse
                                {
                                    Hearing_id = 1,
                                    Court_room = "Room one",
                                    Court_address = "Manchester",
                                    Created_by = "ithc_admin@hearings.reform.hmcts.net",
                                    Created_date = DateTime.Now.AddDays(-2),
                                    Hearing_date = new DateTime(2019, 04, 01, 12, 0, 0),
                                    Hearing_name = "IronMan vs Captain America",
                                    Hearing_number = "2322122CD",
                                    Hearing_type_name = "Application to Set Judgment Aside",
                                    Judge_name = "Judge Lannister",
                                    Scheduled_date_time = new DateTime(2019, 04, 01, 12, 0, 0),
                                    Scheduled_duration = 40,
                                    Last_edit_by = "ithc_admin@hearings.reform.hmcts.net",
                                    Last_edit_date = DateTime.Now.AddHours(-3)
                                }
                            }
                        }
                    },
                    Next_cursor = "-1",
                    Limit = limit,
                    Next_page_url = null,
                    Prev_page_url = null
                };
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
                }

            }
            return participants;
        }
    }
}