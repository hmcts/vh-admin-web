using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using NUnit.Framework;
using System.Net.Http;
using System.Threading.Tasks;
using AdminWebsite.Security;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;
using AdminWebsite.Configuration;
using Microsoft.Extensions.DependencyInjection;
using AdminWebsite.Testing.Common.Builders;
using AdminWebsite.Models;
using Moq;

namespace AdminWebsite.IntegrationTests.Controllers
{
    [Parallelizable(ParallelScope.All)]
    public class ControllerTestsBase
    {
        private TestServer _server;
        private string _accessToken = string.Empty;

        [OneTimeSetUp]
        public async Task OneTimeSetup()
        {
            var webHostBuilder = WebHost.CreateDefaultBuilder()
                .UseKestrel(c => c.AddServerHeader = false)
                .UseEnvironment("Development")
                .UseStartup<Startup>()
                .ConfigureTestServices(OverrideDependenciesInServiceCollection);
            _server = new TestServer(webHostBuilder);
            await GetClientAccessTokenForApi();
        }

        private void OverrideDependenciesInServiceCollection(IServiceCollection services)
        {
            var user = new ClaimsPrincipalBuilder().WithRole(AppRoles.VhOfficerRole).Build();
            var cachedUserClaimBuilder = new Mock<ICachedUserClaimBuilder>();
            cachedUserClaimBuilder.Setup(x => x.BuildAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(user.Claims);
            services.AddTransient(x => cachedUserClaimBuilder.Object);
        }

        private async Task GetClientAccessTokenForApi()
        {
            var configRootBuilder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddEnvironmentVariables()
                .AddUserSecrets<Startup>();

            var configRoot = configRootBuilder.Build();
            var azureAdConfigurationOptions = Options.Create(configRoot.GetSection("AzureAd").Get<AzureAdConfiguration>());
            var azureAdConfiguration = azureAdConfigurationOptions.Value;

            var tokenProvider = new TokenProvider(azureAdConfigurationOptions);
            _accessToken = await tokenProvider.GetClientAccessToken(azureAdConfiguration.ClientId, azureAdConfiguration.ClientSecret, azureAdConfiguration.ClientId);
        }

        protected async Task<HttpResponseMessage> SendGetRequestAsync(string uri)
        {
            using (var client = _server.CreateClient())
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_accessToken}");
                return await client.GetAsync(uri);
            }
        }

        [OneTimeTearDown]
        public void OneTimeTearDown()
        {
            _server.Dispose();
        }
    }
}