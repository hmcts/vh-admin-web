using AdminWebsite.AcceptanceTests.Configuration;
using AdminWebsite.AcceptanceTests.Contexts;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Configuration;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using System.Linq;
using System.Net;
using TechTalk.SpecFlow;
using Testing.Common;
using Testing.Common.Builders.Request;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public class DataSetUp
    {
        private readonly ScenarioContext _scenarioContext;
        public DataSetUp(ScenarioContext scenarioContext)
        {
            _scenarioContext = scenarioContext;
        }
        [BeforeScenario(Order = 0)]
        public void OneTimeSetup(TestsContext testContext)
        {
            var configRootBuilder = new ConfigurationBuilder()
             .AddJsonFile("appsettings.json")
             .AddEnvironmentVariables()
             .AddUserSecrets("f99a3fe8-cf72-486a-b90f-b65c27da84ee");
            var configRoot = configRootBuilder.Build();

            var azureAdConfig = Options.Create(configRoot.GetSection("AzureAd").Get<SecuritySettings>()).Value;
            var vhServiceConfig = Options.Create(configRoot.GetSection("VhServices").Get<ServiceSettings>()).Value;
            var userAccountConfig = Options.Create(configRoot.GetSection("TestUserSecrets").Get<UserAccount>()).Value;
            var authContext = new AuthenticationContext(azureAdConfig.Authority);
            var credential = new ClientCredential(azureAdConfig.ClientId, azureAdConfig.ClientSecret);
            testContext.BearerToken = authContext.AcquireTokenAsync(vhServiceConfig.BookingsApiResourceId, credential).Result.AccessToken;
            testContext.BaseUrl = vhServiceConfig.BookingsApiUrl;
            testContext.TestUserSecrets = userAccountConfig;
        }

        [BeforeScenario(Order = 2)]
        public void CreateNewHearingRequest(TestsContext testContext)
        {
            var tag = _scenarioContext.ScenarioInfo.Tags;
            if (tag.Contains("ExistingPerson"))
            {
                var endpoint = new ApiUriFactory().HearingEndpoints;
                var requestBody = CreateHearingRequest.BuildRequest(TestData.AddParticipants.Email, TestData.AddParticipants.Firstname, TestData.AddParticipants.Lastname);
                testContext.Request = testContext.Post(endpoint.BookNewHearing, requestBody);
                testContext.Response = testContext.Client().Execute(testContext.Request);
                testContext.Response.StatusCode.Should().Be(HttpStatusCode.Created);
                var model = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(testContext.Response.Content);
                testContext.HearingId = model.Id.ToString();
            }
        }

        [AfterScenario(Order = 10)]
        public static void DeleteHearingRequest(TestsContext testContext)
        {
            var hearingId = testContext.HearingId;
            if (!string.IsNullOrEmpty(hearingId))
            {
                var endpoint = new ApiUriFactory().HearingEndpoints;
                testContext.Request = testContext.Delete(endpoint.RemoveHearing(hearingId));
                testContext.Response = testContext.Client().Execute(testContext.Request);
                testContext.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            }            
        }
    }
}