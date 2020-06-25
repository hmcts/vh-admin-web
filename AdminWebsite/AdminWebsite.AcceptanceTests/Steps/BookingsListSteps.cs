using System.Collections.Generic;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver.Drivers;
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
        private string _rowId;
        public BookingsListSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        [When(@"selects a booking")]
        public void ProgressToNextPage()
        {
            _rowId = GetRowId(_c.Test.HearingDetails.CaseNumber);
            _browsers[_c.CurrentUser.Key].Click(BookingsListPage.RowWithId(_rowId));
        }

        [When(@"the user views the bookings list")]
        public void WhenTheUserViewsTheBookingsList()
        {
            _rowId = GetRowId(_c.Test.HearingDetails.CaseNumber);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingsListPage.ScheduledTime(_rowId)).Text.ToLower().Should().Be(_c.Test.HearingSchedule.ScheduledDate.ToShortTimeString().ToLower());
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingsListPage.ScheduledDuration(_rowId)).Text.Should().Contain($"listed for {_c.Test.TestData.HearingSchedule.DurationMinutes} minutes");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingsListPage.CaseName(_rowId, _c.Test.HearingDetails.CaseName)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingsListPage.CaseNumber(_rowId, _c.Test.HearingDetails.CaseNumber)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingsListPage.CaseType(_rowId, _c.Test.HearingDetails.CaseType.Name)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingsListPage.HearingType(_rowId, _c.Test.HearingDetails.HearingType.Name)).Displayed.Should().BeTrue();
            var judge = UserManager.GetClerkUser(_c.UserAccounts);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingsListPage.Judge(_rowId, judge.DisplayName)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingsListPage.Venue(_rowId, _c.Test.TestData.HearingSchedule.HearingVenue)).Displayed.Should().BeTrue();
        }

        private string GetRowId(string caseNumber)
        {
            return _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingsListPage.Row(caseNumber)).GetAttribute("id");
        }
    }
}
