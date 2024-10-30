using System.Net;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;

namespace AdminWebsite.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("api/config")]
    public class ConfigSettingsController : ControllerBase 
    {
        private readonly ApplicationInsightsConfiguration _applicationInsightsConfiguration;
        private readonly AzureAdConfiguration _azureAdConfiguration;
        private readonly Dom1AdConfiguration _dom1AdConfiguration;
        private readonly IFeatureToggles _featureToggles;
        private readonly TestUserSecrets _testUserSecrets;
        private readonly ServiceConfiguration _vhServiceConfiguration;
        private readonly VodafoneConfiguration _vodafoneConfiguration;
        private readonly DynatraceConfiguration _dynatraceConfiguration;

        public ConfigSettingsController(
            IOptions<AzureAdConfiguration> azureAdConfiguration,
            IOptions<Dom1AdConfiguration> dom1AdConfiguration,
            IOptions<VodafoneConfiguration> VodafoneConfiguration,
            IOptions<ApplicationInsightsConfiguration> applicationInsightsConfiguration,
            IOptions<TestUserSecrets> testSettings,
            IOptions<ServiceConfiguration> vhServiceConfiguration,
            IOptions<DynatraceConfiguration> dynatraceConfiguration,
            IFeatureToggles featureToggles)
        {
            _featureToggles = featureToggles;
            _azureAdConfiguration = azureAdConfiguration.Value;
            _dom1AdConfiguration = dom1AdConfiguration.Value;
            _vodafoneConfiguration = VodafoneConfiguration.Value;
            _applicationInsightsConfiguration = applicationInsightsConfiguration.Value;
            _testUserSecrets = testSettings.Value;
            _vhServiceConfiguration = vhServiceConfiguration.Value;
            _dynatraceConfiguration = dynatraceConfiguration.Value;
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
                ConnectionString = _applicationInsightsConfiguration.ConnectionString,
                TestUsernameStem = _testUserSecrets.TestUsernameStem,
                ConferencePhoneNumber = _vodafoneConfiguration.ConferencePhoneNumber,
                ConferencePhoneNumberWelsh = _vodafoneConfiguration.ConferencePhoneNumberWelsh,
                VideoWebUrl = _vhServiceConfiguration.VideoWebUrl,
                LaunchDarklyClientId = _vhServiceConfiguration.LaunchDarklyClientId,
                DynatraceRumLink = _dynatraceConfiguration.DynatraceRumLink
            };

            IdpConfiguration idpConfiguration = _featureToggles.Dom1Enabled()
                ? _dom1AdConfiguration
                : _azureAdConfiguration;
            
            clientSettings.ClientId = idpConfiguration.ClientId;
            clientSettings.TenantId = idpConfiguration.TenantId;
            clientSettings.ResourceId = idpConfiguration.ResourceId;
            clientSettings.TenantId = idpConfiguration.TenantId;
            clientSettings.RedirectUri = idpConfiguration.RedirectUri;
            clientSettings.PostLogoutRedirectUri = idpConfiguration.PostLogoutRedirectUri;

            //settings for reform tenant login page
            clientSettings.ReformTenantConfig = new AzureConfiguration
            {
                ClientId = _azureAdConfiguration.ClientId,
                TenantId = _azureAdConfiguration.TenantId,
                ResourceId = _azureAdConfiguration.ResourceId,
                RedirectUri = _azureAdConfiguration.RedirectUri,
                PostLogoutRedirectUri = _azureAdConfiguration.PostLogoutRedirectUri
            };
            return Ok(clientSettings);
        }
    }
}