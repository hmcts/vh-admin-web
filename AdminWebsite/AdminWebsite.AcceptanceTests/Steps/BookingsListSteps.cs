using System.Collections.Generic;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class BookingsListSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly BookingsListPage _bookingsListPage;
        private string _rowId;
        public BookingsListSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, BookingsListPage bookingsListPage)
        {
            _c = testContext;
            _browsers = browsers;
            _bookingsListPage = bookingsListPage;
        }

        [When(@"selects a booking")]
        public void ProgressToNextPage()
        {
            _rowId = GetRowId(_c.Test.HearingDetails.CaseNumber);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingsListPage.RowWithId(_rowId)).Click();
        }

        [When(@"the user views the bookings list")]
        public void WhenTheUserViewsTheBookingsList()
        {
            _rowId = GetRowId(_c.Test.HearingDetails.CaseNumber);

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingsListPage.ScheduledTime(_rowId)).Text.ToLower()
                .Should().Be(_c.Test.HearingSchedule.ScheduledDate.ToShortTimeString().ToLower());

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingsListPage.ScheduledDuration(_rowId)).Text
                .Should().Contain($"listed for {_c.AdminWebConfig.TestConfig.TestData.HearingSchedule.DurationMinutes} minutes");

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingsListPage.CaseName(_rowId, _c.Test.HearingDetails.CaseName))
                .Displayed.Should().BeTrue();

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingsListPage.CaseNumber(_rowId, _c.Test.HearingDetails.CaseNumber))
                .Displayed.Should().BeTrue();

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingsListPage.HearingType(_rowId, _c.Test.HearingDetails.HearingType.Name))
                .Displayed.Should().BeTrue();

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingsListPage.HearingType(_rowId, _c.Test.HearingDetails.HearingType.Name))
                .Displayed.Should().BeTrue();

            var judge = UserManager.GetClerkUser(_c.UserAccounts);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingsListPage.Judge(_rowId, judge.DisplayName))
                .Displayed.Should().BeTrue();

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingsListPage.Venue(_rowId, _c.AdminWebConfig.TestConfig.TestData.HearingSchedule.HearingVenue))
                .Displayed.Should().BeTrue();
        }

        private string GetRowId(string caseNumber)
        {
            return _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingsListPage.Row(caseNumber)).GetAttribute("id");
        }
    }
}
