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
        private readonly SecuritySettings _securitySettings;

        public ConfigSettingsController(IOptions<SecuritySettings> securitySettings)
        {
            _securitySettings = securitySettings.Value;
        }

        /// <summary>
        /// Get the configuration settings for client
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ClientSettingsResponse), (int) HttpStatusCode.OK)]
        [SwaggerOperation(OperationId = "GetConfigSettings")]
        public ActionResult<ClientSettingsResponse> Get()
        {
            var clientSettings = new ClientSettingsResponse
            {
                ClientId = _securitySettings.ClientId,
                TenantId = _securitySettings.TenantId,
                RedirectUri = _securitySettings.RedirectUri,
                PostLogoutRedirectUri = _securitySettings.PostLogoutRedirectUri
            };

            return Ok(clientSettings);
        }
    }
}