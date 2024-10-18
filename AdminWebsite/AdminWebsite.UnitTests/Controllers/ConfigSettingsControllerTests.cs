using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AdminWebsite.UnitTests.Controllers
{
    public class ConfigSettingsControllerTests
    {
        private Mock<IFeatureToggles> _featureToggleMock;

        [Test]
        public void should_return_dom1_settings_to_client_when_dom1_enabled()
        {
            var azureAdConfiguration = new AzureAdConfiguration
            {
                ClientId = "ClientId", 
                TenantId = "TenantId",
                ClientSecret = "ClientSecret",
                Authority = "Authority",
                RedirectUri = "https://vh-admin-web.com/home",
                PostLogoutRedirectUri = "https://vh-admin-web.com/logout",
                ResourceId = "azureAdResourceId"
            };
            
            var dom1AdConfiguration = new Dom1AdConfiguration()
            {
                ClientId = "Dom1ClientId", 
                TenantId = "Dom1TenantId",
                Authority = "Authority",
                RedirectUri = "https://vh-admin-web.com/home",
                PostLogoutRedirectUri = "https://vh-admin-web.com/logout",
                ResourceId = null
            };
            
            var vodafoneConfiguration = new VodafoneConfiguration { ConferencePhoneNumber = "1111111" };

            var testSettings = new TestUserSecrets
            {
                TestUsernameStem = "@hmcts.net"
            };
            
            var dynatraceConfiguration = new DynatraceConfiguration();

            var configSettingsController = InitController(dom1AdConfiguration, azureAdConfiguration, vodafoneConfiguration, testSettings, dynatraceConfiguration);
            _featureToggleMock.Setup(opt => opt.Dom1Enabled()).Returns(true);

            var actionResult = (OkObjectResult)configSettingsController.Get().Result;
            var clientSettings = (ClientSettingsResponse)actionResult.Value;
            
            clientSettings.ClientId.Should().Be(dom1AdConfiguration.ClientId);
            clientSettings.TenantId.Should().Be(dom1AdConfiguration.TenantId);
            clientSettings.RedirectUri.Should().Be(dom1AdConfiguration.RedirectUri);
            clientSettings.PostLogoutRedirectUri.Should().Be(dom1AdConfiguration.PostLogoutRedirectUri);
            clientSettings.ResourceId.Should().BeNull();
            clientSettings.ConferencePhoneNumber.Should().Be(vodafoneConfiguration.ConferencePhoneNumber);
            clientSettings.TestUsernameStem.Should().Be(testSettings.TestUsernameStem);
        }

        [Test]
        public void should_return_vh_settings_to_client_when_dom1_disabled()
        {
            var azureAdConfiguration = new AzureAdConfiguration
            {
                ClientId = "ClientId", 
                TenantId = "TenantId",
                ClientSecret = "ClientSecret",
                Authority = "Authority",
                RedirectUri = "https://vh-admin-web.com/home",
                PostLogoutRedirectUri = "https://vh-admin-web.com/logout",
                ResourceId = "azureAdResourceId"
            };
            
            var dom1AdConfiguration = new Dom1AdConfiguration()
            {
                ClientId = "ClientId", 
                TenantId = "TenantId",
                Authority = "Authority",
                RedirectUri = "https://vh-admin-web.com/home",
                PostLogoutRedirectUri = "https://vh-admin-web.com/logout",
                ResourceId = null
            };
            
            var vodafoneConfiguration = new VodafoneConfiguration { ConferencePhoneNumber = "1111111" };

            var testSettings = new TestUserSecrets
            {
                TestUsernameStem = "@hmcts.net"
            };

            var dynatraceConfiguration = new DynatraceConfiguration();
            
            var configSettingsController = InitController(dom1AdConfiguration, azureAdConfiguration, vodafoneConfiguration, testSettings, dynatraceConfiguration);
            _featureToggleMock.Setup(opt => opt.Dom1Enabled()).Returns(false);

            var actionResult = (OkObjectResult)configSettingsController.Get().Result;
            var clientSettings = (ClientSettingsResponse)actionResult.Value;
            
            clientSettings.ClientId.Should().Be(dom1AdConfiguration.ClientId);
            clientSettings.TenantId.Should().Be(dom1AdConfiguration.TenantId);
            clientSettings.RedirectUri.Should().Be(dom1AdConfiguration.RedirectUri);
            clientSettings.PostLogoutRedirectUri.Should().Be(dom1AdConfiguration.PostLogoutRedirectUri);
            clientSettings.ResourceId.Should().Be(azureAdConfiguration.ResourceId);
            clientSettings.ConferencePhoneNumber.Should().Be(vodafoneConfiguration.ConferencePhoneNumber);
            clientSettings.TestUsernameStem.Should().Be(testSettings.TestUsernameStem);

        }

        private ConfigSettingsController InitController(Dom1AdConfiguration dom1AdConfiguration,
            AzureAdConfiguration azureAdConfiguration, VodafoneConfiguration vodafoneConfiguration,
            TestUserSecrets testSettings, DynatraceConfiguration dynatraceConfiguration)
        {
            _featureToggleMock = new Mock<IFeatureToggles>();
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
                Options.Create(vodafoneConfiguration),
                Options.Create(applicationInsightsConfiguration),
                Options.Create(testSettings),
                Options.Create(vhServiceConfiguration),
                Options.Create(dynatraceConfiguration),
                _featureToggleMock.Object) {

                ControllerContext = controllerContext
            };
            
            return configSettingsController;
        }
    }
}
