using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class BookingDetails : Common
    {
        private readonly BrowserContext _browserContext;
        public BookingDetails(BrowserContext browserContext) : base(browserContext)
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
        public string EditedDate() => GetElementText(By.Id("edit-date"));
        public string CreatedDate() => GetElementText(By.Id("created-date"));
        public string ParticipantEmail() => GetElementText(By.Id("//*[@id='participant_email0']/div[1]"));
        public string ParticipantUsername() => GetElementText(By.XPath("//*[@id='participant_userName0']/div[2]"));
        public string JudgeEmail() => GetElementText(By.Id("judge-name"));
        public string JudgeUsername() => GetElementText(By.XPath("//*[@id='participant_userNameundefined']/div[2]"));
        public string ParticipantRole() => GetElementText(By.Id("participant_role"));
        public void EditBookingList() => ClickElement(By.Id("edit-button"));
        public void SelectHearing(string hearing) => SelectOption(By.XPath("//*[@class='govuk-grid-column-one-quarter'][2]/div[1]"), hearing);
        public string BookingDetailsTitle() => GetElementText(By.XPath("//h1[@class='govuk-heading-l']"));
        public string CaseNumber() => GetElementText(By.Id("hearing-number"));
        public string CaseName() => GetElementText(By.Id("hearing-name"));
        public string CaseHearingType() => GetElementText(By.Id("hearing-type"));
        public string HearingDate() => GetElementText(By.Id("hearing-start"));
        public string CourtAddress() => GetElementText(By.Id("court-room-address"));
        public string HearingDuration() => GetElementText(By.Id("duration"));
        public string OtherInformation() => GetElementText(By.Id("otherInformation"));
        public void CancelBookingButton() => ClickElement(By.Id("cancel-button"));
        public void PopupCancelBookingButton() => ClickElement(By.Id("btnCancelBooking"));
        public void PopupKeepBookingButton() => ClickElement(By.Id("btnKeepBooking"));
        public string CancelledLabel() => GetElementText(By.Id("lblCancelled"));
        public string PopupCancelBookingWarningMessage() => GetElementText(By.CssSelector("h1.govuk-heading-m"));
    }
}