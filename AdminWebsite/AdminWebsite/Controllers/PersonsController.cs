using AdminWebsite.BookingsAPI.Client;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Collections.Generic;
using System.Net;
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

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public PersonsController(IBookingsApiClient bookingsApiClient)
        {
            _bookingsApiClient = bookingsApiClient;
        }

        /// <summary>
        /// Gets person list by email search term.
        /// </summary>
        /// <param name="term">The email address search term.</param>
        /// <returns> The list of person</returns>
        [HttpGet("search/{term}")]
        [SwaggerOperation(OperationId = "GetPersonBySearchTerm")]
        [ProducesResponseType(typeof(List<PersonResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<IList<PersonResponse>>> GetPersonBySearchTerm(string term)
        {
            try
            {
                var personsResponse = await _bookingsApiClient.GetPersonBySearchTermAsync(term);
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
