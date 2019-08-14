using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.AcceptanceTests.Configuration;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.BookingsAPI.Client;
using RestSharp;
using Testing.Common;

namespace AdminWebsite.AcceptanceTests.Contexts
{
    public class TestContext
    {
        public RestRequest Request { get; set; }
        public IRestResponse Response { get; set; }
        public string BookingsApiBearerToken { get; set; }
        public string BookingsApiBaseUrl { get; set; }
        public string UserApiBearerToken { get; set; }
        public string UserApiBaseUrl { get; set; }
        public string Json { get; set; }
        public Guid HearingId { get; set; }
        public TestSettings TestUserSecrets { get; set; }
        public SecuritySettings AzureAd { get; set; }
        public List<UserAccount> UserAccounts { get; set; }
        public BookNewHearingRequest HearingRequest { get; set; }
        public TestData TestData { get; set; }
        public UserAccount CurrentUser { get; set; }
        public HearingDetailsResponse Hearing { get; set; }
        public TargetBrowser TargetBrowser { get; set; }

        public TestContext()
        {
            TestData =  new TestData();
        }

        public RestRequest Get(string path) => new RestRequest(path, Method.GET);

        public RestRequest Post(string path, object requestBody)
        {
            var request = new RestRequest(path, Method.POST);
            request.AddParameter("Application/json", ApiRequestHelper.SerialiseRequestToSnakeCaseJson(requestBody),
                ParameterType.RequestBody);
            return request;
        }

        public RestRequest Delete(string path) => new RestRequest(path, Method.DELETE);

        public RestRequest Put(string path, object requestBody)
        {
            var request = new RestRequest(path, Method.PUT);
            request.AddParameter("Application/json", ApiRequestHelper.SerialiseRequestToSnakeCaseJson(requestBody),
                ParameterType.RequestBody);
            return request;
        }

        public RestRequest Patch(string path, object requestBody = null)
        {
            var request = new RestRequest(path, Method.PATCH);
            request.AddParameter("Application/json", ApiRequestHelper.SerialiseRequestToSnakeCaseJson(requestBody),
                ParameterType.RequestBody);
            return request;
        }

        public RestClient BookingsApiClient()
        {
            var client = new RestClient(BookingsApiBaseUrl);
            client.AddDefaultHeader("Accept", "application/json");
            client.AddDefaultHeader("Authorization", $"Bearer {BookingsApiBearerToken}");
            return client;
        }

        public RestClient UserApiClient()
        {
            var client = new RestClient(UserApiBaseUrl);
            client.AddDefaultHeader("Accept", "application/json");
            client.AddDefaultHeader("Authorization", $"Bearer {UserApiBearerToken}");
            return client;
        }

        public IRestResponse BookingsApiExecute()
        {
            return BookingsApiClient().Execute(Request);
        }

        public IRestResponse UserApiExecute()
        {
            return UserApiClient().Execute(Request);
        }

        public UserAccount GetClerkUser()
        {
            return UserAccounts.First(x => x.Role.StartsWith("Clerk"));
        }

        public List<UserAccount> GetCaseAdminUsers()
        {
            return UserAccounts.Where(x => x.Role.StartsWith("Case admin")).ToList();
        }

        public UserAccount GetCivilMoneyCaseAdminUser()
        {
            return UserAccounts.First(x => x.Role.StartsWith("Case admin") && x.Displayname.Contains("CMC") && !x.Displayname.Contains("FR"));
        }

        public UserAccount GetFinancialRemedyCaseAdminUser()
        {
            return UserAccounts.First(x => x.Role.StartsWith("Case admin") && x.Displayname.Contains("FR"));
        }

        public UserAccount GetCivilMoneyVideoHearingsOfficerUser()
        {
            return UserAccounts.First(x => x.Role.StartsWith("Video hearings officer") && x.Displayname.Contains("CMC") && !x.Displayname.Contains("FR"));
        }

        public UserAccount GetFinancialRemedyVideoHearingsOfficerUser()
        {
            return UserAccounts.First(x => x.Role.StartsWith("Video hearings officer") && x.Displayname.Contains("FR"));
        }

        public List<UserAccount> GetIndividualUsers()
        {
            return UserAccounts.Where(x => x.Role.StartsWith("Individual")).ToList();
        }

        public List<UserAccount> GetRepresentativeUsers()
        {
            return UserAccounts.Where(x => x.Role.StartsWith("Representative")).ToList();
        }

        public UserAccount GetNonAdminUser()
        {
            return UserAccounts.First(x => x.Role.StartsWith("Individual"));
        }
    }
}