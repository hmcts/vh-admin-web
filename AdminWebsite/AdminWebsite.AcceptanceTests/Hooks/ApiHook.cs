using TechTalk.SpecFlow;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Testing.Common;
using Testing.Common.Builders.Request;
using System;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using AdminWebsite.AcceptanceTests.Helpers;
using Microsoft.Extensions.Configuration;
using AdminWebsite.Configuration;
using FluentAssertions;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public class ApiHook
    {        
        [BeforeTestRun]
        public static async Task CreateTheNewHearingRequest()
        {
            var bearer = $"Bearer {GetClientAccessTokenForBookHearingApi()}";
            var request = CreateHearingRequest.BuildRequest(TestData.AddParticipants.Email, TestData.AddParticipants.Firstname, TestData.AddParticipants.Lastname);
            var jsonBody = ApiRequestHelper.SerialiseRequestToSnakeCaseJson(request);
            var test = new StringContent(jsonBody, Encoding.UTF8, "application/json");
            using (var client = new HttpClient())
            {
                HearingEndpoints _endpoints = new ApiUriFactory().HearingEndpoints;
                client.DefaultRequestHeaders.Add("Authorization", $"{bearer}");
                client.BaseAddress = new Uri("https://localhost:5300");
                var result = await client.PostAsync(_endpoints.BookNewHearing, test);
                result.IsSuccessStatusCode.Should().BeTrue("Hearing can not be created");
            }

        }
        
        private static string GetClientAccessTokenForBookHearingApi()
        {
            var configRootBuilder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddUserSecrets("f99a3fe8-cf72-486a-b90f-b65c27da84ee");

            var security = new SecuritySettings();
            var service = new ServiceSettings();
            var testUserSecrets = new TestConfigSettings();
            var config = configRootBuilder.Build();
            config.Bind("AzureAd", security);
            config.Bind("VhServices", service);
            var authContext = new AuthenticationContext(security.Authority);
            var credential = new ClientCredential(security.ClientId, security.ClientSecret);
            return authContext.AcquireTokenAsync(service.BookingsApiResourceId, credential).Result.AccessToken;
        }
    }
}
