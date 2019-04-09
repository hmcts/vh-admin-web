using AdminWebsite.BookingsAPI.Client;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Collections.Generic;
using System.Net;

namespace AdminWebsite.Controllers
{
    /// <summary>
    /// Responsible for retrieving and storing person information
    /// </summary>
    [Produces("application/json")]
    [Route("api/persons")]
    [ApiController]
    public class PersonController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public PersonController(IBookingsApiClient bookingsApiClient)
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
        public IActionResult GetPersonBySearchTerm(string term)
        {
            try
            {
                var personsResponse = _bookingsApiClient.GetPersonBySearchTerm(term);
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
