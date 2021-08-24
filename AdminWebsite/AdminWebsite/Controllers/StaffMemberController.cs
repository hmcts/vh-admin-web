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
    /// Responsible for retrieving and storing person information
    /// </summary>
    [Produces("application/json")]
    [Route("api/staffmember")]
    [ApiController]
    public class StaffMemberController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly JavaScriptEncoder _encoder;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public StaffMemberController(IBookingsApiClient bookingsApiClient, JavaScriptEncoder encoder)
        {
            _bookingsApiClient = bookingsApiClient;
            _encoder = encoder;
        }

        /// <summary>
        /// Find staff member list by email search term.
        /// </summary>
        /// <param name = "term" > The email address search term.</param>
        /// <returns> The list of person</returns>
        [HttpGet]
        [SwaggerOperation(OperationId = "GetStaffMembersBySearchTerm")]
        [ProducesResponseType(typeof(List<PersonResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<IList<PersonResponse>>> GetStaffMembersBySearchTerm([FromBody] string term)
        {
            if(term.Length < 3)
            {
                return BadRequest("Search term must be atleast 3 charecters.");
            }

            try
            {
                term = _encoder.Encode(term);
                var searchTerm = new SearchTermRequest(term);

                var personsResponse = await _bookingsApiClient.GetStaffMemberBySearchTermAsync(searchTerm);
                
                return Ok(personsResponse.ToList());
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
    }
}
