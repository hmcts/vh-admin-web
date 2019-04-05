using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class BookingsList : Common
    {
        private readonly BrowserContext _browserContext;
        public BookingsList(BrowserContext browserContext) : base(browserContext)
        {
            _browserContext = browserContext;
        }

        public string HearingScheduleDate(string scheduleDate)
        {
            SelectOption(By.XPath(""), scheduleDate);
            return ToString();
        }

        public string CreatedBy() => GetElementText(By.Id("created-by"));
        public string EditedBy() => GetElementText(By.Id("edit-by"));
        public string ParticipantEmail() => GetElementText(By.Id("participant_email"));
        public string ParticipantUsername() => GetElementText(By.Id("participant_userName"));
        public string ParticipantRole() => GetElementText(By.Id("participant_role"));
    }
}