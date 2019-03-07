using AdminWebsite.AcceptanceTests.Helpers;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class BookingsList : Common
    {
        private readonly BrowserContext _browserContext;
        public BookingsList(BrowserContext browserContext) : base(browserContext)
        {
            _browserContext = browserContext;
        }    
    }
}
