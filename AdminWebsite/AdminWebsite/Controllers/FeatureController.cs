using BookingsApi.Client;
using BookingsApi.Contract.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using System.Threading.Tasks;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/feature-toggle")]
    [ApiController]
    public class FeatureController : ControllerBase
    {
        private readonly IBookingsApiClient _bookingsApiClient;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public FeatureController(IBookingsApiClient bookingsApiClient)
        {
            _bookingsApiClient = bookingsApiClient;
        }

        /// <summary>
        /// returns the FeatureToggles
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [SwaggerOperation(OperationId = "GetFeatureToggles")]
        [ProducesResponseType(typeof(FeatureToggleConfiguration), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<FeatureToggleConfiguration>> GetFeatureToggles()
        {
            return await _bookingsApiClient.GetFeatureTogglesAsync();
        }
    }
}
