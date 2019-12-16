using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
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
        private readonly BookingConfirmationPage _bookingConfirmationPage;
        private readonly CommonAdminWebPage _commonAdminWebPage;
        public BookingConfirmationSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, BookingConfirmationPage bookingConfirmationPage, CommonAdminWebPage commonAdminWebPage)
        {
            _c = testContext;
            _browsers = browsers;
            _bookingConfirmationPage = bookingConfirmationPage;
            _commonAdminWebPage = commonAdminWebPage;
        }

        [When(@"the user views the booking confirmation form")]
        public void ProgressToNextPage()
        {
            VerifyBookingWasSuccessful();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_commonAdminWebPage.BookingsListLink).Click();
        }

        private void VerifyBookingWasSuccessful()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingConfirmationPage.SuccessMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingConfirmationPage.CaseNumber).Text.Should().Be(_c.Test.Hearing.CaseNumber);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingConfirmationPage.CaseName).Text.Should().Be(_c.Test.Hearing.CaseName);
            var scheduleDate = _c.Test.Hearing.ScheduledDate.ToString(DateFormats.HearingSummaryDate);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingConfirmationPage.HearingDate).Text.ToLower().Should().Be(scheduleDate.ToLower());
        }

        [When(@"the user clicks the Book another hearing button")]
        public void WhenTheUserClicksTheBookAnotherHearingButton()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_bookingConfirmationPage.BookAnotherHearingButton).Click();
        }
    }
}
