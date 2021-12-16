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
        private readonly KinlyConfiguration _kinlyConfiguration;
        private readonly ApplicationInsightsConfiguration _applicationInsightsConfiguration;
        private readonly TestUserSecrets _testUserSecrets;
        private readonly ServiceConfiguration _vhServiceConfiguration;

        public ConfigSettingsController(
            IOptions<AzureAdConfiguration> azureAdConfiguration,
            IOptions<KinlyConfiguration> kinlyConfiguration,
            IOptions<ApplicationInsightsConfiguration> applicationInsightsConfiguration,
            IOptions<TestUserSecrets> testSettings,
            IOptions<ServiceConfiguration> vhServiceConfiguration)
        {
            _azureAdConfiguration = azureAdConfiguration.Value;
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
                ClientId = _azureAdConfiguration.ClientId,
                TenantId = _azureAdConfiguration.TenantId,
                RedirectUri = _azureAdConfiguration.RedirectUri,
                PostLogoutRedirectUri = _azureAdConfiguration.PostLogoutRedirectUri,
                InstrumentationKey = _applicationInsightsConfiguration.InstrumentationKey,
                TestUsernameStem = _testUserSecrets.TestUsernameStem,
                ConferencePhoneNumber = _kinlyConfiguration.ConferencePhoneNumber,
                ConferencePhoneNumberWelsh = _kinlyConfiguration.ConferencePhoneNumberWelsh,
                JoinByPhoneFromDate = _kinlyConfiguration.JoinByPhoneFromDate,
                VideoWebUrl = _vhServiceConfiguration.VideoWebUrl
            };

            return Ok(clientSettings);
        }
    }
}