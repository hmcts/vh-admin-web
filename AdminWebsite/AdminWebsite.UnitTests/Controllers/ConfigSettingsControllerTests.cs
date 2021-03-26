using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using NUnit.Framework;

namespace AdminWebsite.UnitTests
{
    public class ConfigSettingsControllerTests
    {
        [Test]
        public void Should_return_response_with_settings()
        {
            var securitySettings = new SecuritySettings
            {
                ClientId = "ClientId", 
                TenantId = "TenantId",
                ClientSecret = "ClientSecret",
                Authority = "Authority",
                RedirectUri = "https://vh-admin-web.com",
                PostLogoutRedirectUri = "https://vh-admin-web.com/"
            };

            var testSettings = new TestUserSecrets
            {
                TestUsernameStem = "@hmcts.net"
            };

            var serviceSettings = new ServiceSettings { ConferencePhoneNumber = "1111111", JoinByPhoneFromDate= "2021-02-03" };

            var httpContext = new DefaultHttpContext();
            httpContext.Request.Scheme = "https";
            httpContext.Request.Host = new HostString("vh-admin-web.com");
            httpContext.Request.PathBase = "";

            var controllerContext = new ControllerContext {
                HttpContext = httpContext
            };

            var configSettingsController = new ConfigSettingsController(
                Options.Create(securitySettings),
                Options.Create(testSettings),
                Options.Create(serviceSettings)) {

                ControllerContext = controllerContext
            };

            var actionResult = (OkObjectResult)configSettingsController.Get().Result;
            var clientSettings = (ClientSettingsResponse)actionResult.Value;
            
            clientSettings.ClientId.Should().Be(securitySettings.ClientId);
            clientSettings.TenantId.Should().Be(securitySettings.TenantId);
            clientSettings.RedirectUri.Should().Be(securitySettings.RedirectUri);
            clientSettings.PostLogoutRedirectUri.Should().Be(securitySettings.PostLogoutRedirectUri);
            clientSettings.TestUsernameStem.Should().Be(testSettings.TestUsernameStem);
            clientSettings.ConferencePhoneNumber.Should().Be(serviceSettings.ConferencePhoneNumber);
            clientSettings.JoinByPhoneFromDate.Should().Be(serviceSettings.JoinByPhoneFromDate);

        }
    }
}
