using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
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
        private readonly UserManager _userManager;
        private readonly IUserIdentity _userIdentity;

        public HearingsController(IBookingsApiClient bookingsApiClient, UserManager userManager, IUserIdentity userIdentity)
        {
            _bookingsApiClient = bookingsApiClient;
            _userManager = userManager;
            _userIdentity = userIdentity;
        }

        /// <summary>
        /// Create a hearing
        /// </summary>
        /// <param name="hearingRequest">Hearing Request object</param>
        /// <returns>VideoHearingId</returns>
        [HttpPost]
        [SwaggerOperation(OperationId = "BookNewHearing")]
        [ProducesResponseType(typeof(long), (int)HttpStatusCode.Created)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public ActionResult<long> Post([FromBody] BookNewHearingRequest hearingRequest)
        {
            //hearingRequest.Created_by = User.Identity.Name;
            //hearingRequest.Feeds.Add(AddAdministrator());
            //foreach (var feed in hearingRequest.Feeds)
            //{
            //    foreach (var participant in feed.Participants)
            //    {
            //        if (participant != null)
            //        {
            //            // judge and admins are managed internally since the number of users is small
            //            if (participant.Role == "Judge" || participant.Role == "Administrator")
            //            {
            //                participant.Username = participant.Email;
            //            }
            //            else
            //            {
            //                CreateAdAccountIfRequired(participant);
            //            }
            //        }
            //    }
            //}
            try
            {
                var hearingId = _bookingsApiClient.BookNewHearingAsync(hearingRequest);
                return Created("", hearingId);
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

        //private void CreateAdAccountIfRequired(Models.ParticipantRequest participant)
        //{
        //    var existingParticipantUsername =
        //        _userManager.GetUsernameForUserWithRecoveryEmail(participant.Email);

        //    if (string.IsNullOrWhiteSpace(existingParticipantUsername))
        //    {
        //        var username = _userManager.CreateAdAccount(participant.First_name, participant.Last_name,
        //            participant.Email, participant.Role);
        //        participant.Username = username;
        //    }
        //    else
        //    {
        //        participant.Username = existingParticipantUsername;
        //        _userManager.AddToGroupsByUsername(participant.Username, participant.Role);
        //    }
        //}

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
            IEnumerable<string> caseTypes;
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
                // var bookingsResponse =_bookingsApiClient.GetHearingsByTypes(hearingTypesIds, cursor, limit);
                var bookingsResponse = new BookingsResponse();
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
            var hearingTypes = new List<HearingTypeResponse>(); // _bookingsApiClient.GetHearingTypes();
            if (hearingTypes != null && hearingTypes.Any())
            {
                typeIds = hearingTypes.Where(s => caseTypes.Any(x => x == s.Group)).Select(s => s.Id.Value).ToList();
            }

            return typeIds;
        }

        // Add Administrator to the hearing.
        //private FeedRequest AddAdministrator()
        //{
        //    return _userManager.AddAdministrator();
        //}
    }
}