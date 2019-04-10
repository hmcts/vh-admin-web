using System;
using AdminWebsite.Configuration;
using AdminWebsite.Security;
using System.Net.Http;
using System.Threading.Tasks;
using AdminWebsite.IntegrationTests.Helper;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using NUnit.Framework;

namespace AdminWebsite.IntegrationTests.Controllers
{
    [Parallelizable(ParallelScope.All)]
    public class ControllerTestsBase
    {
        private TestServer _server;
        private string _bearerToken = String.Empty;
        
        [OneTimeSetUp]
        public void OneTimeSetup()
        {
            var webHostBuilder =
                WebHost.CreateDefaultBuilder()
                    .UseEnvironment("Development")
                    .UseKestrel(c => c.AddServerHeader = false)
                    .UseStartup<Startup>();
            _server = new TestServer(webHostBuilder);
            GetClientAccessTokenForBookHearingApi();
        }

        private void GetClientAccessTokenForBookHearingApi()
        {
            var securitySettings = new TestSettings().Security;
            _bearerToken = new TokenProvider(Options.Create(securitySettings)).GetClientAccessToken(
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