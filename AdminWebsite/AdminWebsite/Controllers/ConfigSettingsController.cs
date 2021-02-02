using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("api/config")]
    public class ConfigSettingsController : ControllerBase
    {
        private readonly SecuritySettings _securitySettings;
        private readonly TestUserSecrets _testSettings;
        private readonly ServiceSettings _serviceSettings;

        public ConfigSettingsController(
            IOptions<SecuritySettings> securitySettings, 
            IOptions<TestUserSecrets> testSettings,
            IOptions<ServiceSettings> serviceSettings)
        {
            _securitySettings = securitySettings.Value;
            _testSettings = testSettings.Value;
            _serviceSettings = serviceSettings.Value;
        }

        /// <summary>
        /// Get the configuration settings for client
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ClientSettingsResponse), (int)HttpStatusCode.OK)]
        [SwaggerOperation(OperationId = "GetConfigSettings")]
        public ActionResult<ClientSettingsResponse> Get()
        {
            var clientSettings = new ClientSettingsResponse
            {
                ClientId = _securitySettings.ClientId,
                TenantId = _securitySettings.TenantId,
                RedirectUri = _securitySettings.RedirectUri,
                PostLogoutRedirectUri = _securitySettings.PostLogoutRedirectUri,
                InstrumentationKey = _securitySettings.InstrumentationKey,
                TestUsernameStem = _testSettings.TestUsernameStem,
                ConferencePhoneNumber = _serviceSettings.ConferencePhoneNumber,
                OptionOnJoinByPhoneDate = _serviceSettings.OptionOnJoinByPhoneDate
            };

            return Ok(clientSettings);
        }
    }
}