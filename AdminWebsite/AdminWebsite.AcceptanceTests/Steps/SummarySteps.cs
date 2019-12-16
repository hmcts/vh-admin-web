using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Api.Clients;
using AcceptanceTests.Common.Api.Requests;
using AcceptanceTests.Common.Api.Uris;
using AcceptanceTests.Common.Api.Users;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.BookingsAPI.Client;
using FluentAssertions;
using RestSharp;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class SummarySteps : ISteps
    {
        private const int Timeout = 60;
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly SummaryPage _summaryPage;
        public SummarySteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, SummaryPage summaryPage)
        {
            _c = testContext;
            _browsers = browsers;
            _summaryPage = summaryPage;
        }

        [When(@"the user views the information on the summary form")]
        public void ProgressToNextPage()
        {
            VerifyHearingDetails();
            VerifyHearingSchedule();
            VerifyOtherInformation();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_summaryPage.BookButton).Click();
            VerifyBookingCreated();
            VerifyNewUsersCreatedInAad();
        }

        private void VerifyHearingDetails()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_summaryPage.CaseNumber).Text.Should().Be(_c.Test.Hearing.CaseNumber);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_summaryPage.CaseName).Text.Should().Be(_c.Test.Hearing.CaseName);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_summaryPage.CaseHearingType).Text.Should().Be(_c.Test.Hearing.HearingType.Name);
        }

        private void VerifyHearingSchedule()
        {
            var scheduleDate = _c.Test.Hearing.ScheduledDate.ToString(DateFormats.HearingSummaryDate);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_summaryPage.HearingDate).Text.ToLower().Should().Be(scheduleDate.ToLower());
            var courtAddress = $"{_c.AdminWebConfig.TestConfig.TestData.HearingSchedule.HearingVenue}, {_c.AdminWebConfig.TestConfig.TestData.HearingSchedule.Room}";
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_summaryPage.CourtAddress).Text.Should().Be(courtAddress);
            var listedFor = $"listed for {_c.AdminWebConfig.TestConfig.TestData.HearingSchedule.DurationMinutes} minutes";
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_summaryPage.HearingDuration).Text.Should().Be(listedFor);
        }

        private void VerifyOtherInformation()
        {
            var otherInformation = _c.AdminWebConfig.TestConfig.TestData.OtherInformation.Other;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_summaryPage.OtherInformation).Text.Should().Be(otherInformation);
        }

        private void VerifyBookingCreated()
        {
            var endpoint = new HearingsEndpoints().GetHearingsByUsername(UserManager.GetClerkUser(_c.AdminWebConfig.UserAccounts).Username);
            var request = new RequestBuilder().Get(endpoint);
            var client = new ApiClient(_c.AdminWebConfig.VhServices.BookingsApiUrl, _c.Tokens.BookingsApiBearerToken).GetClient();
            var hearing = PollForHearing(request, client);
            var assertHearing = new AssertHearing()
                .WithHearing(hearing)
                .WithTestData(_c.AdminWebConfig.TestConfig.TestData)
                .CreatedBy(_c.CurrentUser.Username);
            assertHearing.AssertHearingDataMatches(_c.Test.Hearing);
            assertHearing.AssertParticipantDataMatches(_c.Test.HearingParticipants);
            assertHearing.AssertHearingStatus(HearingDetailsResponseStatus.Booked);
        }

        private HearingDetailsResponse PollForHearing(IRestRequest request, RestClient client)
        {
            for (var i = 0; i < Timeout; i++)
            {
                var response = new RequestExecutor(request).SendToApi(client);
                var hearings = RequestHelper.DeserialiseSnakeCaseJsonToResponse<List<HearingDetailsResponse>>(response.Content);
                if (hearings != null)
                {
                    foreach (var hearing in hearings.Where(hearing =>
                        hearing.Cases.First().Name.Equals(_c.Test.Hearing.CaseName)))
                    {
                        return hearing;
                    }
                }

                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            throw new DataException("Created hearing could not be found in the bookings api");
        }

        private void VerifyNewUsersCreatedInAad()
        {
            var userApiManager = new UserApiManager(_c.AdminWebConfig.VhServices.UserApiUrl, _c.Tokens.UserApiBearerToken);
            foreach (var participant in _c.Test.HearingParticipants.Where(participant => participant.DisplayName.Contains(_c.AdminWebConfig.TestConfig.TestData.AddParticipant.Participant.NewUserPrefix)))
            {
                userApiManager.CheckIfParticipantExistsInAad(participant.AlternativeEmail, Timeout);
            }
        }
    }
}
