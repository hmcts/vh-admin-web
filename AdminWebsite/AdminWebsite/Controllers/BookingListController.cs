using AdminWebsite.Contracts.Requests;
using AdminWebsite.Security;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Responses;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace AdminWebsite.Controllers
{
    /// <summary>
    /// Responsible for retrieving and storing hearing information
    /// </summary>
    [Produces("application/json")]
    [Route("api/hearings")]
    [ApiController]
    public class BookingListController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly IUserIdentity _userIdentity;
        private readonly JavaScriptEncoder _encoder;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public BookingListController(IBookingsApiClient bookingsApiClient, IUserIdentity userIdentity,
              JavaScriptEncoder encoder)
        {
            _bookingsApiClient = bookingsApiClient;
            _userIdentity = userIdentity;
            _encoder = encoder;
        }

        /// <summary>
        /// Gets the all upcoming bookings hearing by the given case types for a hearing administrator.
        /// </summary>
        /// <param name="request"></param>
        /// <returns> The hearings list</returns>
        [HttpPost("bookingsList")]
        [SwaggerOperation(OperationId = "BookingsList")]
        [ProducesResponseType(typeof(BookingsResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult> GetBookingsList([FromBody]BookingSearchRequest request)
        {
            if (request.StartDate > request.EndDate)
            {
                return BadRequest("startDate must be less than or equal to endDate");
            }

            if (request.Cursor != null)
            {
                request.Cursor = _encoder.Encode(request.Cursor);
            }
            if (_userIdentity.IsAdministratorRole())
            {
                request.CaseTypes ??= new List<string>();
                request.CaseTypes.AddRange(_userIdentity.GetGroupDisplayNames());
            }
            else
            {
                return Unauthorized();
            }
            try
            {
                var caseTypesIds = await GetCaseTypesId(request.CaseTypes);
                request.CaseNumber = string.IsNullOrWhiteSpace(request.CaseNumber) ? string.Empty : request.CaseNumber;
                request.LastName = string.IsNullOrWhiteSpace(request.LastName) ? string.Empty : request.LastName;

                var bookingsResponse = await _bookingsApiClient.GetHearingsByTypesAsync(
                    new GetHearingRequest
                    {
                        Limit = request.Limit,
                        Cursor = request.Cursor,
                        FromDate = request.StartDate,
                        EndDate = request.EndDate,
                        Types = caseTypesIds,
                        CaseNumber = request.CaseNumber,
                        VenueIds = request.VenueIds,
                        LastName = request.LastName,
                        NoJudge = request.Nojudge
                    });

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

        private async Task<List<int>> GetCaseTypesId(IEnumerable<string> caseTypes)
        {
            var typeIds = new List<int>();
            var types = await _bookingsApiClient.GetCaseTypesAsync();
            if (types != null && types.Any())
                foreach (var item in caseTypes)
                {
                    var caseType = types.FirstOrDefault(s => s.Name == item);
                    if (caseType != null && typeIds.All(s => s != caseType.Id))
                    {
                        typeIds.Add(caseType.Id);
                    }
                }
            return typeIds;
        }
    }
}