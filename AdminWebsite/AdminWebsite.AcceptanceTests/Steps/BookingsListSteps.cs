using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
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
    }
}
