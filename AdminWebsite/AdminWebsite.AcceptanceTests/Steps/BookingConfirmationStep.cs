using AdminWebsite.AcceptanceTests.Contexts;
using AdminWebsite.AcceptanceTests.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using BookingConfirmation = AdminWebsite.AcceptanceTests.Pages.BookingConfirmation;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class BookingConfirmationStep
    {
        private readonly TestContext _context;
        private readonly BookingConfirmation _bookingConfirmation;

        public BookingConfirmationStep(TestContext context, BookingConfirmation bookingConfirmation)
        {
            _context = context;
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
            var expectedResult = $"{Data.BookingConfirmation.BookingConfirmationMessage} {_bookingConfirmation.GetItems("CaseNumber")} {_context.TestData.HearingData.CaseName} {_bookingConfirmation.GetItems("HearingDate")}";
            var hearingId = _bookingConfirmation.ExecuteScript("return sessionStorage.getItem('newHearingId')");
            _bookingConfirmation.AddItems<string>("HearingId", hearingId);
            hearingId.Should().NotBeNullOrEmpty();            
            expectedResult.ToLower().Should().Contain(actualResult.ToLower());
        }

        [When(@"admin user returns to dashboard")]
        public void BookAnotherHearing()
        {
            _bookingConfirmation.BookAnotherHearing();
            _bookingConfirmation.PageUrl(PageUri.HearingDetailsPage);
        }
    }
}