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
        private readonly AzureAdConfiguration _azureAdConfiguration;
        private readonly Dom1AdConfiguration _dom1AdConfiguration;
        private readonly KinlyConfiguration _kinlyConfiguration;
        private readonly ApplicationInsightsConfiguration _applicationInsightsConfiguration;
        private readonly TestUserSecrets _testUserSecrets;
        private readonly ServiceConfiguration _vhServiceConfiguration;

        public ConfigSettingsController(
            IOptions<AzureAdConfiguration> azureAdConfiguration,
            IOptions<Dom1AdConfiguration> dom1AdConfiguration,
            IOptions<KinlyConfiguration> kinlyConfiguration,
            IOptions<ApplicationInsightsConfiguration> applicationInsightsConfiguration,
            IOptions<TestUserSecrets> testSettings,
            IOptions<ServiceConfiguration> vhServiceConfiguration)
        {
            _azureAdConfiguration = azureAdConfiguration.Value;
            _dom1AdConfiguration = dom1AdConfiguration.Value;
            _kinlyConfiguration = kinlyConfiguration.Value;
            _applicationInsightsConfiguration = applicationInsightsConfiguration.Value;
            _testUserSecrets = testSettings.Value;
            _vhServiceConfiguration = vhServiceConfiguration.Value;
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
                InstrumentationKey = _applicationInsightsConfiguration.InstrumentationKey,
                TestUsernameStem = _testUserSecrets.TestUsernameStem,
                ConferencePhoneNumber = _kinlyConfiguration.ConferencePhoneNumber,
                ConferencePhoneNumberWelsh = _kinlyConfiguration.ConferencePhoneNumberWelsh,
                JoinByPhoneFromDate = _kinlyConfiguration.JoinByPhoneFromDate,
                VideoWebUrl = _vhServiceConfiguration.VideoWebUrl,
                LaunchDarklyClientId = _vhServiceConfiguration.LaunchDarklyClientId
            };

            // DOM1 in dev is hearings reform
            // default to azure ad resource id because scope in setup differently in hearings reform
            if (_azureAdConfiguration.ClientId == _dom1AdConfiguration.ClientId)
            {
                clientSettings.ClientId = _azureAdConfiguration.ClientId;
                clientSettings.TenantId = _azureAdConfiguration.TenantId;
                clientSettings.ResourceId = _azureAdConfiguration.ResourceId;
                clientSettings.TenantId = _azureAdConfiguration.TenantId;
                clientSettings.RedirectUri = _azureAdConfiguration.RedirectUri;
                clientSettings.PostLogoutRedirectUri = _azureAdConfiguration.PostLogoutRedirectUri;
            }
            else
            {
                clientSettings.ClientId = _dom1AdConfiguration.ClientId;
                clientSettings.TenantId = _dom1AdConfiguration.TenantId;
                clientSettings.ResourceId = null;
                clientSettings.TenantId = _dom1AdConfiguration.TenantId;
                clientSettings.RedirectUri = _dom1AdConfiguration.RedirectUri;
                clientSettings.PostLogoutRedirectUri = _dom1AdConfiguration.PostLogoutRedirectUri;
            }

            return Ok(clientSettings);
        }
    }
}