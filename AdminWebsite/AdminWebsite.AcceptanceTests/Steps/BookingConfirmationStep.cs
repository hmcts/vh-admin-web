using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class BookingConfirmationStep
    {
        private readonly BookingConfirmation _bookingConfirmation;
        public BookingConfirmationStep(BookingConfirmation bookingConfirmation)
        {
            _bookingConfirmation = bookingConfirmation;
        }
        [Given(@"user is on booking confirmation page")]
        public void BookingsListPage()
        {
            _bookingConfirmation.PageUrl(PageUri.BookingConfirmationPage);
        }
        [When(@"hearing is booked")]
        [Then(@"hearing should be booked")]
        public void BookHearingConfirmation()
        {
            BookingsListPage();
            var actualResult = _bookingConfirmation.ConfirmationMessage();
            var expectedResult = $"{TestData.BookingConfirmation.BookingConfirmationMessage} {TestData.HearingDetails.CaseNumber} {TestData.HearingDetails.CaseName} {_bookingConfirmation.GetItems("HearingDate")}";
            var hearingId = _bookingConfirmation.SessionStorage("return sessionStorage.getItem('newHearingId')");
            _bookingConfirmation.AddItems<string>("HearingId", hearingId);
            hearingId.Should().NotBeNullOrEmpty();            
            expectedResult.Should().Be(actualResult);
        }
        [When(@"admin user returns to dashboard")]
        public void WhenAdminUserReturnsToBookingList()
        {
            _bookingConfirmation.ReturnToDashboard();
            _bookingConfirmation.PageUrl(PageUri.DashboardPage);
        }
    }
}