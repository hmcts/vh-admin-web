using System;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Newtonsoft.Json;

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
        private readonly IFeatureToggles _featureToggles;

        public ConfigSettingsController(
            IOptions<AzureAdConfiguration> azureAdConfiguration,
            IOptions<Dom1AdConfiguration> dom1AdConfiguration,
            IOptions<KinlyConfiguration> kinlyConfiguration,
            IOptions<ApplicationInsightsConfiguration> applicationInsightsConfiguration,
            IOptions<TestUserSecrets> testSettings,
            IOptions<ServiceConfiguration> vhServiceConfiguration, 
            IFeatureToggles featureToggles)
        {
            _featureToggles = featureToggles;
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

            IdpConfiguration idpConfiguration = _featureToggles.Dom1Enabled()
                ? _dom1AdConfiguration
                : _azureAdConfiguration;
            clientSettings.ClientId = idpConfiguration.ClientId;
            clientSettings.TenantId = idpConfiguration.TenantId;
            clientSettings.ResourceId = idpConfiguration.ResourceId;
            clientSettings.TenantId = idpConfiguration.TenantId;
            clientSettings.RedirectUri = idpConfiguration.RedirectUri;
            clientSettings.PostLogoutRedirectUri = idpConfiguration.PostLogoutRedirectUri;

            return Ok(clientSettings);
        }
        
        [HttpGet("test")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ClientSettingsResponse), (int)HttpStatusCode.OK)]
        [SwaggerOperation(OperationId = "GetTestConfigSettings")]
        public ActionResult<ClientSettingsResponse> GetTest()
        {

            _azureAdConfiguration.ClientSecret = null;
            var DOM1 = _dom1AdConfiguration;
            var VH = _azureAdConfiguration;
            return Ok(new {DOM = DOM1, VH});
        }
    }
}