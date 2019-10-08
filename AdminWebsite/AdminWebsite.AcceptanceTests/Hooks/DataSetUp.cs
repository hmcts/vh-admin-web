using System;
using System.Collections.Generic;
using AdminWebsite.AcceptanceTests.Configuration;
using AdminWebsite.AcceptanceTests.Contexts;
using AdminWebsite.Configuration;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using System.Net;
using AdminWebsite.AcceptanceTests.Helpers;
using TechTalk.SpecFlow;
using SecuritySettings = AdminWebsite.AcceptanceTests.Configuration.SecuritySettings;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public class DataSetUp
    {
        [BeforeScenario(Order = 0)]
        public void OneTimeSetup(TestContext testContext)
        {
            var configRootBuilder = new ConfigurationBuilder()
             .AddJsonFile("appsettings.json")
             .AddJsonFile("useraccounts.json")
             .AddEnvironmentVariables()
             .AddUserSecrets("f99a3fe8-cf72-486a-b90f-b65c27da84ee");
            var configRoot = configRootBuilder.Build();

            var azureAdConfig = Options.Create(configRoot.GetSection("AzureAd").Get<SecuritySettings>()).Value;
            var vhServiceConfig = Options.Create(configRoot.GetSection("VhServices").Get<ServiceSettings>()).Value;
            var testSecrets = Options.Create(configRoot.GetSection("TestUserSecrets").Get<TestSettings>()).Value;
            var testAccounts = Options.Create(configRoot.GetSection("UserAccounts").Get<List<UserAccount>>()).Value;
            var authContext = new AuthenticationContext(azureAdConfig.Authority);
            var credential = new ClientCredential(azureAdConfig.ClientId, azureAdConfig.ClientSecret);

            testSecrets.TestUsernameStem.Should().NotBeNullOrEmpty();
            testSecrets.TestUserPassword.Should().NotBeNullOrEmpty();
            testAccounts.Count.Should().BeGreaterThan(0);
            vhServiceConfig.BookingsApiUrl.Should().NotBeNullOrEmpty();
            vhServiceConfig.UserApiUrl.Should().NotBeNullOrEmpty();

            testContext.BookingsApiBearerToken = authContext.AcquireTokenAsync(vhServiceConfig.BookingsApiResourceId, credential).Result.AccessToken;
            testContext.BookingsApiBaseUrl = vhServiceConfig.BookingsApiUrl;
            testContext.UserApiBearerToken = authContext.AcquireTokenAsync(vhServiceConfig.UserApiResourceId, credential).Result.AccessToken;
            testContext.UserApiBaseUrl = vhServiceConfig.UserApiUrl;
            testContext.TestUserSecrets = testSecrets;
            testContext.UserAccounts = testAccounts;
            testContext.AzureAd = azureAdConfig;

            foreach (var user in testContext.UserAccounts)
            {
                user.Username = $"{user.Displayname}{testSecrets.TestUsernameStem}";
            }
        }

        [BeforeScenario(Order = 1)]
        public void CheckApisHealth(TestContext testContext)
        {
            CheckBookingsApiHealth(testContext);
            CheckUserApiHealth(testContext);
        }

        public static void CheckBookingsApiHealth(TestContext testContext)
        {
            var endpoint = new BookingsApiUriFactory().HealthCheckEndpoints;
            testContext.Request = testContext.Get(endpoint.HealthCheck);
            testContext.Response = testContext.BookingsApiClient().Execute(testContext.Request);
            testContext.Response.StatusCode.Should().Be(HttpStatusCode.OK, $"Unable to connect to the Bookings Api at {testContext.BookingsApiBaseUrl}");
        }

        public static void CheckUserApiHealth(TestContext testContext)
        {
            var endpoint = new UserApiUriFactory().HealthCheckEndpoints;
            testContext.Request = testContext.Get(endpoint.CheckServiceHealth());
            testContext.Response = testContext.UserApiClient().Execute(testContext.Request);
            testContext.Response.StatusCode.Should().Be(HttpStatusCode.OK, "Unable to connect to the User Api");
        }

        [BeforeScenario(Order = 2)]
        public static void ClearAnyHearings(TestContext context, HearingsEndpoints endpoints)
        {
            DataSetupHelper dataSetupHelper = new DataSetupHelper();
            dataSetupHelper.ClearHearings(context, endpoints, context.GetIndividualUsers());
            dataSetupHelper.ClearHearings(context, endpoints, context.GetRepresentativeUsers());
        }

        [AfterScenario(Order = 10)]
        public static void RemoveHearing(TestContext context, HearingsEndpoints endpoints)
        {
            DataSetupHelper dataSetupHelper = new DataSetupHelper();
            dataSetupHelper.ClearHearings(context, endpoints, context.GetIndividualUsers());
            dataSetupHelper.ClearHearings(context, endpoints, context.GetRepresentativeUsers());
        }
    }
}