using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
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


        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public HearingsController(IBookingsApiClient bookingsApiClient, IUserIdentity userIdentity)
        {
            _bookingsApiClient = bookingsApiClient;
            _userIdentity = userIdentity;
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
        public async Task<ActionResult<string>> Post([FromBody] BookNewHearingRequest hearingRequest)
        {
            try
            {
                var hearingDetailsResponse = await _bookingsApiClient.BookNewHearingAsync(hearingRequest);
                return Created("", hearingDetailsResponse.Id);
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