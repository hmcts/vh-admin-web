using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
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
    [Route("api/persons")]
    [ApiController]
    public class PersonsController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly JavaScriptEncoder _encoder;
        private readonly TestUserSecrets _testSettings;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public PersonsController(IBookingsApiClient bookingsApiClient, JavaScriptEncoder encoder, IOptions<TestUserSecrets> testSettings)
        {
            _bookingsApiClient = bookingsApiClient;
            _encoder = encoder;
            _testSettings = testSettings.Value;
        }

        /// <summary>
        /// Find person list by email search term.
        /// </summary>
        /// <param name = "term" > The email address search term.</param>
        /// <returns> The list of person</returns>
        [HttpPost]
        [SwaggerOperation(OperationId = "PostPersonBySearchTerm")]
        [ProducesResponseType(typeof(List<PersonResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<IList<PersonResponse>>> PostPersonBySearchTerm([FromBody] string term)
        {
            try
            {
                term = _encoder.Encode(term);
                var searchTerm = new SearchTermRequest
                {
                    Term = term
                };

                var personsResponse = await _bookingsApiClient.PostPersonBySearchTermAsync(searchTerm);
                personsResponse = personsResponse?.Where(p => !p.Contact_email.Contains(_testSettings.TestUsernameStem)).ToList();

                return Ok(personsResponse);
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
