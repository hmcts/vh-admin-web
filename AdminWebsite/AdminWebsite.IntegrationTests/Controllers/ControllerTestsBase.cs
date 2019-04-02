using System;
using AdminWebsite.Configuration;
using AdminWebsite.Security;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Services;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using Moq;
using NUnit.Framework;
using Testing.Common.Security;

namespace AdminWebsite.IntegrationTests.Controllers
{
    [Parallelizable(ParallelScope.All)]
    public class ControllerTestsBase
    {
        private TestServer _server;
        private string _bearerToken = String.Empty;

        protected readonly Mock<IBookingsApiClient> BookingsApiClient;

        protected ControllerTestsBase()
        {   
            BookingsApiClient = new Mock<IBookingsApiClient>();
        }

        
        [OneTimeSetUp]
        public void OneTimeSetup()
        {
            var webHostBuilder =
                WebHost.CreateDefaultBuilder()
                    .UseEnvironment("Development")
                    .UseKestrel(c => c.AddServerHeader = false)
                    .UseStartup<Startup>()
                    .ConfigureServices(MockServices);

            _server = new TestServer(webHostBuilder);
            GetClientAccessTokenForBookHearingApi();
        }

        private void MockServices(IServiceCollection services)
        {
            services.AddSingleton<IBookingsApiClient>(BookingsApiClient.Object);

            var accessor = new Mock<IHttpContextAccessor>();
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(x => x.User).Returns(new TestPrincipal());
            accessor.Setup(x => x.HttpContext).Returns(httpContext.Object);
            services.AddSingleton(accessor.Object);
        }

        private void GetClientAccessTokenForBookHearingApi()
        {
            var configRootBuilder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddUserSecrets<Startup>();
            
            var configRoot = configRootBuilder.Build();

            var securitySettingsOptions = Options.Create(configRoot.GetSection("AzureAd").Get<SecuritySettings>());
            var securitySettings = securitySettingsOptions.Value;
            _bearerToken = new TokenProvider(securitySettingsOptions).GetClientAccessToken(
                securitySettings.ClientId, securitySettings.ClientSecret,
                securitySettings.ClientId);
        }

        [OneTimeTearDown]
        public void OneTimeTearDown()
        {
            _server.Dispose();
        }
        
        protected async Task<HttpResponseMessage> SendGetRequestAsync(string uri)
        {
            using (var client = _server.CreateClient())
            {
               client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_bearerToken}");
                return await client.GetAsync(uri);
            }
        }

        protected async Task<HttpResponseMessage> SendPostRequestAsync(string uri, HttpContent httpContent)
        {
            using (var client = _server.CreateClient())
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_bearerToken}");
                return await client.PostAsync(uri, httpContent);
            }
        }

        protected async Task<HttpResponseMessage> SendPatchRequestAsync(string uri, StringContent httpContent)
        {
            using (var client = _server.CreateClient())
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_bearerToken}");
                return await client.PatchAsync(uri, httpContent);
            }
        }

        protected async Task<HttpResponseMessage> SendPutRequestAsync(string uri, StringContent httpContent)
        {
            using (var client = _server.CreateClient())
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_bearerToken}");
                return await client.PutAsync(uri, httpContent);
            }
        }

        protected async Task<HttpResponseMessage> SendDeleteRequestAsync(string uri)
        {
            using (var client = _server.CreateClient())
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_bearerToken}");
                return await client.DeleteAsync(uri);
            }
        }
    }
}