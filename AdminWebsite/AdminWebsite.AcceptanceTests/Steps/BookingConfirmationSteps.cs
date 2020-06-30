using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class BookingConfirmationSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        public BookingConfirmationSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        public void ProgressToNextPage()
        {
            VerifyBookingWasSuccessful();
            _browsers[_c.CurrentUser.Key].ClickLink(_c.Route.Equals(Page.BookingDetails)
                ? BookingConfirmationPage.ViewThisBookingLink
                : CommonAdminWebPage.BookingsListLink);
        }

        [When(@"the user views the booking confirmation form")]
        public void VerifyBookingWasSuccessful()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingConfirmationPage.SuccessMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingConfirmationPage.CaseNumber).Text.Should().Be(_c.Test.HearingDetails.CaseNumber);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingConfirmationPage.CaseName).Text.Should().Be(_c.Test.HearingDetails.CaseName);
            var scheduleDate = _c.Test.HearingSchedule.ScheduledDate.ToString(DateFormats.HearingSummaryDate);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(BookingConfirmationPage.HearingDate).Text.ToLower().Should().Be(scheduleDate.ToLower());
        }

        [When(@"the user clicks the Return to dashboard link")]
        public void WhenTheUserClicksTheDashboardLink()
        {
            _browsers[_c.CurrentUser.Key].ClickLink(BookingConfirmationPage.ReturnToDashboardLink);
        }

        [When(@"the user clicks the Book another hearing button")]
        public void WhenTheUserClicksTheBookAnotherHearingButton()
        {
            _browsers[_c.CurrentUser.Key].Click(BookingConfirmationPage.BookAnotherHearingButton);
        }
    }
}
