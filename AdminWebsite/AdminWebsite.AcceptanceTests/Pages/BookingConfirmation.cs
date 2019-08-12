
using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class BookingConfirmation : Common
    {
        private readonly Browser _browser;
        public BookingConfirmation(Browser browser) : base(browser)
        {
            _browser = browser;
        }
        public string ConfirmationPanel() => GetElementText(By.XPath("//*[@class='govuk-panel__title']"));
        public string CaseNumber() => GetElementText(By.Id("caseNumber"));
        public string CaseName() => GetElementText(By.Id("caseName"));
        public string HearingDate() => GetElementText(By.Id("hearingDate"));
        public void BookAnotherHearing() => ClickElement(By.Id("btnBookAnotherHearing"));
        public void ReturnToDashboard() => ClickElement(By.XPath("//a[@class='govuk-link']"));

        public string ConfirmationMessage()
        {
            return $"{ConfirmationPanel()} {CaseNumber()} {CaseName()} {HearingDate()}".Replace("\r\n", " ");
        }
    }
}