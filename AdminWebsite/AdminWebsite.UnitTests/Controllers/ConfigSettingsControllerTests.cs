using System.Reflection;
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
        private ConfigSettingsController _controller;

        private AzureAdConfiguration _azureAdConfiguration = new AzureAdConfiguration
        {
            ClientId = "ClientId",
            TenantId = "TenantId",
            ClientSecret = "ClientSecret",
            Authority = "Authority",
            RedirectUri = "https://vh-admin-web.com/home",
            PostLogoutRedirectUri = "https://vh-admin-web.com/logout",
            ResourceId = "azureAdResourceId"
        };

        private Dom1AdConfiguration _dom1AdConfiguration = new Dom1AdConfiguration()
        {
            ClientId = "Dom1ClientId",
            TenantId = "Dom1TenantId",
            Authority = "Authority",
            RedirectUri = "https://vh-admin-web.com/home",
            PostLogoutRedirectUri = "https://vh-admin-web.com/logout",
            ResourceId = null
        };

        private VodafoneConfiguration _vodafoneConfiguration = new VodafoneConfiguration { ConferencePhoneNumber = "1111111" };

        private TestUserSecrets _testSettings = new TestUserSecrets
        {
            TestUsernameStem = "@hmcts.net"
        };

        private DynatraceConfiguration _dynatraceConfiguration = new DynatraceConfiguration();

        [SetUp]
        public void Setup()
        {
            _controller = InitController(_dom1AdConfiguration, _azureAdConfiguration, _vodafoneConfiguration, _testSettings, _dynatraceConfiguration);
        }

        [Test]
        public void should_return_dom1_settings_to_client_when_dom1_enabled()
        {
            _featureToggleMock.Setup(opt => opt.Dom1Enabled()).Returns(true);

            var actionResult = (OkObjectResult)_controller.Get().Result;
            var clientSettings = (ClientSettingsResponse)actionResult.Value;

            clientSettings.ClientId.Should().Be(_dom1AdConfiguration.ClientId);
            clientSettings.TenantId.Should().Be(_dom1AdConfiguration.TenantId);
            clientSettings.RedirectUri.Should().Be(_dom1AdConfiguration.RedirectUri);
            clientSettings.PostLogoutRedirectUri.Should().Be(_dom1AdConfiguration.PostLogoutRedirectUri);
            clientSettings.ResourceId.Should().BeNull();
            clientSettings.ConferencePhoneNumber.Should().Be(_vodafoneConfiguration.ConferencePhoneNumber);
            clientSettings.TestUsernameStem.Should().Be(_testSettings.TestUsernameStem);
        }

        [Test]
        public void should_return_vh_settings_to_client_when_dom1_disabled()
        {
            _featureToggleMock.Setup(opt => opt.Dom1Enabled()).Returns(false);

            var dom1AdConfiguration = new Dom1AdConfiguration()
            {
                ClientId = "ClientId", 
                TenantId = "TenantId",
                Authority = "Authority",
                RedirectUri = "https://vh-admin-web.com/home",
                PostLogoutRedirectUri = "https://vh-admin-web.com/logout",
                ResourceId = null
            };

            _controller = InitController(dom1AdConfiguration, _azureAdConfiguration, _vodafoneConfiguration, _testSettings, _dynatraceConfiguration);

            var actionResult = (OkObjectResult)_controller.Get().Result;
            var clientSettings = (ClientSettingsResponse)actionResult.Value;

            clientSettings.ClientId.Should().Be(dom1AdConfiguration.ClientId);
            clientSettings.TenantId.Should().Be(dom1AdConfiguration.TenantId);
            clientSettings.RedirectUri.Should().Be(dom1AdConfiguration.RedirectUri);
            clientSettings.PostLogoutRedirectUri.Should().Be(dom1AdConfiguration.PostLogoutRedirectUri);
            clientSettings.ResourceId.Should().Be(_azureAdConfiguration.ResourceId);
            clientSettings.ConferencePhoneNumber.Should().Be(_vodafoneConfiguration.ConferencePhoneNumber);
            clientSettings.TestUsernameStem.Should().Be(_testSettings.TestUsernameStem);

        }

        [Test]
        public void get_version_should_return_app_version()
        {
            // Arrange
            var version = new Version(1, 0, 0, 0);
            var mockAssembly = new Mock<Assembly>();
            mockAssembly.Setup(a => a.GetName()).Returns(new AssemblyName { Version = null });

            // Act
            var result = (OkObjectResult)_controller.GetVersion().Result;
            var versionResult = (AppVersionResponse)result.Value;

            // Assert
            versionResult.AppVersion.Should().NotBeNullOrEmpty();
            versionResult.AppVersion.Should().NotBe("Unknown");
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

            var controllerContext = new ControllerContext
            {
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
                _featureToggleMock.Object)
            {

                ControllerContext = controllerContext
            };

            return configSettingsController;
        }
    }
}
