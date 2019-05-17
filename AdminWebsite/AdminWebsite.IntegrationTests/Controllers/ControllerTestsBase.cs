using AdminWebsite.Helper;
using AdminWebsite.IntegrationTests.Helper;
using AdminWebsite.Security;
using AdminWebsite.Services.Models;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Moq;
using NUnit.Framework;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AdminWebsite.IntegrationTests.Controllers
{
    [Parallelizable(ParallelScope.All)]
    public class ControllerTestsBase
    {
        private TestServer _server;
        private string _accessToken = string.Empty;

        [OneTimeSetUp]
        public void OneTimeSetup()
        {
            var webHostBuilder =
                WebHost.CreateDefaultBuilder()
                    .UseEnvironment("Development")
                    .UseKestrel(c => c.AddServerHeader = false)
                    .UseStartup<Startup>()
                    // Override the the service container here, add mocks or stubs
                    .ConfigureTestServices(OverrideDependenciesInServiceCollection)
                    // Reconfigure the services 
                    .ConfigureServices(services =>
                    {
                        // Reconfigure the authentication mechanism to allow different settings 
                        services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
                        {
                            options.Audience = "https://test";
                            options.BackchannelHttpHandler = new MockBackchannel();
                            options.MetadataAddress = "https://inmemory.microsoft.com/common/.well-known/openid-configuration";
                            // Validate signature using self signed token that BearerTokenBuilder builds
                            options.TokenValidationParameters = new TokenValidationParameters
                            {
                                SignatureValidator = (token, parameters) => new JwtSecurityToken(token)
                            };
                        });
                    });

            CreateAccessToken();

            _server = new TestServer(webHostBuilder);
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

        private static void OverrideDependenciesInServiceCollection(IServiceCollection services)
        {
            var cachedUserClaimBuilder = new Mock<ICachedUserClaimBuilder>();

            var claims = new AdministratorRoleClaims(new UserRole
            {
                UserRoleType = UserRoleType.None
            }).Claims;

            cachedUserClaimBuilder.Setup
            (
                x => x.BuildAsync(It.IsAny<string>(), It.IsAny<string>())
            )
            .ReturnsAsync(claims);

            services.AddTransient(x => cachedUserClaimBuilder.Object);
        }

        private void CreateAccessToken()
        {
            _accessToken = new BearerTokenBuilder()
                .WithClaim(ClaimTypes.Name, "doctor@who.com")
                // We are using a self signed certificate to create the SigningCredentials used when signing a token
                .WithSigningCertificate(EmbeddedResourceReader.GetCertificate())
                .BuildToken();
        }
    }
}