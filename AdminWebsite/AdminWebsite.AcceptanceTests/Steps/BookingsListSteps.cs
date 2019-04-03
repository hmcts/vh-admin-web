using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class BookingsListSteps
    {
        private readonly BookingsList _bookingsList;
        public BookingsListSteps(BookingsList bookingsList)
        {
            _bookingsList = bookingsList;
        }
        [When(@"user is on bookings list page")]
        public void BookingsListPage()
        {
            _bookingsList.PageUrl(PageUri.BookingListPage);
        }
        [Then(@"admin user can view booking list")]
        public void ThenAdminUserCanViewBookingList()
        {
            _bookingsList.BookingsList();
            BookingsListPage();
        }
        [When(@"admin user tries to amend booking")]
        public void UpdateParticipantDetails()
        {
            _bookingsList.BookingsList();
            BookingsListPage();
            _bookingsList.SelectHearing(_bookingsList.GetItems("CaseNumber"));
            _bookingsList.EditBookingList();
            _bookingsList.BookingDetailsTitle().Should().Be(_bookingsList.GetItems("CaseNumber"));
        }
    }
}