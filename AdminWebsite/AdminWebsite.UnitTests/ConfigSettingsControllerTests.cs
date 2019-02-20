using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using NUnit.Framework;

namespace AdminWebsite.UnitTests
{
    public class ConfigSettingsControllerTests
    {
        [Test]
        public void should_return_response_with_settings()
        {
            var securitySettings = new SecuritySettings
            {
                ClientId = "ClientId", 
                TenantId = "TenantId",
                ClientSecret = "ClientSecret",
                Authority = "Authority",
            };

            var configSettingsController = new ConfigSettingsController(Options.Create(securitySettings));

            var actionResult = (OkObjectResult)configSettingsController.Get().Result;
            var clientSettings = (ClientSettingsResponse)actionResult.Value;
            
            clientSettings.ClientId.Should().Be(securitySettings.ClientId);
            clientSettings.TenantId.Should().Be(securitySettings.TenantId);
        }
    }
}
