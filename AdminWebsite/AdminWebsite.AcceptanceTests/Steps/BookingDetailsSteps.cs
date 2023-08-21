using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using BookingsApi.Contract.V1.Responses;
using FluentAssertions;
using TechTalk.SpecFlow;
using TestApi.Contract.Dtos;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class BookingDetailsSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly CommonSharedSteps _commonSharedSteps;
        private readonly BookingsListSteps _bookingsListSteps;

        public BookingDetailsSteps(TestContext testContext, Dictionary<UserDto, UserBrowser> browsers, CommonSharedSteps commonSharedSteps, BookingsListSteps bookingsListSteps)
        {
            _c = testContext;
            _browsers = browsers;
            _commonSharedSteps = commonSharedSteps;
            _bookingsListSteps = bookingsListSteps;
        }

        [When(@"the user views the booking details")]
        [Then(@"the user views the booking details")]
        public void WhenTheUserViewsTheBookingDetails()
        {
        }

        [When(@"the user confirms the hearing")]
        public void WhenTheUserConfirmsTheBooking()
        {
        }

        [When(@"the user confirms all the hearings")]
        public void WhenTheUserConfirmsAllTheBookings()
        {
        }
        
        [Then(@"the hearing is available in video web")]
        public void ThenTheHearingIsAvailableInTheVideoWeb()
        {
        }

        [Then(@"the hearings are available in video web")]
        public void ThenTheHearingsAreAvailableInTheVideoWeb()
        {
        }

        [Then(@"the conference details match the hearing")]
        public void ThenTheConferenceMatchesTheHearing()
        {
        }

        [When(@"the user cancels the hearing without a cancel reason")]
        public void WhenTheUserCancelsTheHearingWithoutACancelReason()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].ScrollTo(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.ConfirmCancelButton);
        }

        [Then(@"an error message is displayed and hearing is not cancelled")]
        public void ThenAnErrorMessageIsDisplayedAndHearingIsNotCancelled()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CancelReasonDropdownErrorLabel).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.KeepBookingButton);
        }

        [When(@"the user cancels the hearing")]
        public void WhenTheUserAttemptsToCancelTheHearing()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].ScrollTo(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.CancelButton);

            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver,
                BookingDetailsPage.CancelReasonDropdown, _c.Test.TestData.BookingDetailsPage.CancelReason);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.ConfirmCancelButton);
        }

        [When(@"the user cancels the hearing with other reason and no text")]
        public void WhenTheUserCancelsTheHearingWithOtherReason()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].ScrollTo(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.CancelButton);

            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver,
                BookingDetailsPage.CancelReasonDropdown, _c.Test.TestData.BookingDetailsPage.CancelReason2);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.ConfirmCancelButton);
        }

        [Then(@"an error message is displayed for the details box and hearing is not cancelled")]
        public void ThenAnErrorMessageIsDisplayedForTheDetailsBoxAndHearingIsNotCancelled()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CancelReasonDetailsErrorLabel).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.KeepBookingButton);
        }

        [Then(@"the hearing is cancelled")]
        public void ThenTheHearingIsCancelled()
        {
        }

        [Then(@"the conference is deleted")]
        public void ThenTheConferenceIsDeleted()
        {
        }

        [When(@"the user cancels the hearing with other reason and detail text")]
        public void WhenTheUserCancelsTheHearingWithOtherReasonAndDetailText()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].ScrollTo(BookingDetailsPage.CancelButton);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.CancelButton);

            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver,
                BookingDetailsPage.CancelReasonDropdown, _c.Test.TestData.BookingDetailsPage.CancelReason2);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.CancelReasonTextfield).SendKeys(_c.Test.TestData.BookingDetailsPage.DetailReason);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.ConfirmCancelButton);
        }

        public void ClickEdit()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(BookingDetailsPage.EditButton);
            _browsers[_c.CurrentUser].ScrollTo(BookingDetailsPage.EditButton);
            _browsers[_c.CurrentUser].Click(BookingDetailsPage.EditButton);
        }
        public void ProgressToNextPage() { }
    }
}
