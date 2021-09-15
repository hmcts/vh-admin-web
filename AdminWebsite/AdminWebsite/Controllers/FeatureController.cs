using AdminWebsite.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [Route("api/feature-toggle")]
    [ApiController]
    public class FeatureController : ControllerBase
    {
        private readonly FeatureToggleConfiguration _featureToggleOptions;

        /// <summary>
        /// Instantiates the controller
        /// </summary>
        public FeatureController(IOptions<FeatureToggleConfiguration> options)
        {
            _featureToggleOptions = options.Value;
        }

        /// <summary>
        /// returns the FeatureToggles
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [SwaggerOperation(OperationId = "GetFeatureToggles")]
        [ProducesResponseType(typeof(FeatureToggleConfiguration), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public ActionResult<FeatureToggleConfiguration> GetFeatureToggles()
        {
            return _featureToggleOptions;
        }
    }
}
