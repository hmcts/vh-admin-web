using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers
{
    public class ConfigSettingsControllerTests
    {
        [Test]
        public void should_return_dom1_idp_settings_when_dom1_config_is_enabled()
        {
            var vhAdConfiguration = new AzureAdConfiguration
            {
                ClientId = "VHClientId", 
                TenantId = "VHTenantId",
                ClientSecret = "VHClientSecret",
                Authority = "Authority",
                RedirectUri = "https://vh-admin-web.com/home",
                PostLogoutRedirectUri = "https://vh-admin-web.com/logout",
                ResourceId = "VHazureAdResourceId"
            };
            
            var dom1AdConfiguration = new Dom1AdConfiguration()
            {
                ClientId = "Dom1ClientId", 
                TenantId = "Dom1TenantId",
                Authority = "Authority",
                RedirectUri = "https://vh-admin-web.com/home",
                PostLogoutRedirectUri = "https://vh-admin-web.com/logout",
                ResourceId = null,
                Enabled = true
            };
            
            var kinlyConfiguration = new KinlyConfiguration { ConferencePhoneNumber = "1111111", JoinByPhoneFromDate= "2021-02-03" };

            var testSettings = new TestUserSecrets
            {
                TestUsernameStem = "@hmcts.net"
            };

            
            var configSettingsController = InitController(dom1AdConfiguration, vhAdConfiguration, kinlyConfiguration, testSettings);

            var actionResult = (OkObjectResult)configSettingsController.Get().Result;
            var clientSettings = (ClientSettingsResponse)actionResult.Value;
            
            clientSettings.ClientId.Should().Be(dom1AdConfiguration.ClientId);
            clientSettings.TenantId.Should().Be(dom1AdConfiguration.TenantId);
            clientSettings.RedirectUri.Should().Be(dom1AdConfiguration.RedirectUri);
            clientSettings.PostLogoutRedirectUri.Should().Be(dom1AdConfiguration.PostLogoutRedirectUri);
            clientSettings.ResourceId.Should().BeNull();
            clientSettings.ConferencePhoneNumber.Should().Be(kinlyConfiguration.ConferencePhoneNumber);
            clientSettings.JoinByPhoneFromDate.Should().Be(kinlyConfiguration.JoinByPhoneFromDate);
            clientSettings.TestUsernameStem.Should().Be(testSettings.TestUsernameStem);
        }

        [Test]
        public void should_return_vh_idp_settings_when_dom1_config_is_not_enabled()
        {
            var vhAdConfiguration = new AzureAdConfiguration
            {
                ClientId = "VHClientId", 
                TenantId = "VHTenantId",
                ClientSecret = "VHClientSecret",
                Authority = "Authority",
                RedirectUri = "https://vh-admin-web.com/home",
                PostLogoutRedirectUri = "https://vh-admin-web.com/logout",
                ResourceId = "VHazureAdResourceId"
            };
            
            var dom1AdConfiguration = new Dom1AdConfiguration()
            {
                ClientId = "DOM1ClientId", 
                TenantId = "DOM1TenantId",
                Authority = "Authority",
                RedirectUri = "https://vh-admin-web.com/home",
                PostLogoutRedirectUri = "https://vh-admin-web.com/logout",
                ResourceId = null,
                Enabled = false
            };
            
            var kinlyConfiguration = new KinlyConfiguration { ConferencePhoneNumber = "1111111", JoinByPhoneFromDate= "2021-02-03" };

            var testSettings = new TestUserSecrets
            {
                TestUsernameStem = "@hmcts.net"
            };

            
            var configSettingsController = InitController(dom1AdConfiguration, vhAdConfiguration, kinlyConfiguration, testSettings);

            var actionResult = (OkObjectResult)configSettingsController.Get().Result;
            var clientSettings = (ClientSettingsResponse)actionResult.Value;
            
            clientSettings.ClientId.Should().Be(vhAdConfiguration.ClientId);
            clientSettings.TenantId.Should().Be(vhAdConfiguration.TenantId);
            clientSettings.RedirectUri.Should().Be(vhAdConfiguration.RedirectUri);
            clientSettings.PostLogoutRedirectUri.Should().Be(vhAdConfiguration.PostLogoutRedirectUri);
            clientSettings.ResourceId.Should().Be(vhAdConfiguration.ResourceId);
            clientSettings.ConferencePhoneNumber.Should().Be(kinlyConfiguration.ConferencePhoneNumber);
            clientSettings.JoinByPhoneFromDate.Should().Be(kinlyConfiguration.JoinByPhoneFromDate);
            clientSettings.TestUsernameStem.Should().Be(testSettings.TestUsernameStem);

        }
        
        private static ConfigSettingsController InitController(Dom1AdConfiguration dom1AdConfiguration,
            AzureAdConfiguration azureAdConfiguration, KinlyConfiguration kinlyConfiguration,
            TestUserSecrets testSettings)
        {
            var applicationInsightsConfiguration = new ApplicationInsightsConfiguration();

            var httpContext = new DefaultHttpContext
            {
                Request =
                {
                    Scheme = "https",
                    Host = new HostString("vh-admin-web.com"),
                    PathBase = ""
                }
            };

            var vhServiceConfiguration = new ServiceConfiguration { VideoWebUrl = "https://vh-web/" };

            var controllerContext = new ControllerContext {
                HttpContext = httpContext
            };

            var configSettingsController = new ConfigSettingsController(
                Options.Create(azureAdConfiguration),
                Options.Create(dom1AdConfiguration),
                Options.Create(kinlyConfiguration),
                Options.Create(applicationInsightsConfiguration),
                Options.Create(testSettings),
                Options.Create(vhServiceConfiguration)) {

                ControllerContext = controllerContext
            };
            
            return configSettingsController;
        }
    }
}
