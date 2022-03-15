using AdminWebsite.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.Responses;

namespace AdminWebsite.Controllers
{
    /// <summary>
    /// Responsible for retrieving and storing hearing information
    /// </summary>
    [Produces("application/json")]
    [Route("api/hearings")]
    [ApiController]
    public class BookingListController:ControllerBase
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
        /// <param name="cursor">The unique sequential value of hearing ID.</param>
        /// <param name="limit">The max number of hearings to be returned.</param>
        /// <param name="caseNumber"></param>
        /// <param name="venueIds"></param>
        /// <returns> The hearings list</returns>
        [HttpGet]
        [SwaggerOperation(OperationId = "GetBookingsList")]
        [ProducesResponseType(typeof(BookingsResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult> GetBookingsList(string cursor, int limit = 100, string caseNumber = "", [FromQuery]List<int> venueIds = null)
        {
            if (cursor != null)
            {
                cursor = _encoder.Encode(cursor);
            }

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

                var hearingTypesIds = await GetHearingTypesId(types);
                
                caseNumber = string.IsNullOrWhiteSpace(caseNumber) ? string.Empty : caseNumber;
                
                var bookingsResponse = await _bookingsApiClient.GetHearingsByTypesAsync(hearingTypesIds, cursor, limit, null, caseNumber, venueIds);

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

        private async Task<List<int>> GetHearingTypesId(IEnumerable<string> caseTypes)
        {
            var typeIds = new List<int>();
            var types = await _bookingsApiClient.GetCaseTypesAsync();
            if (types == null || !types.Any()) return typeIds;
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
