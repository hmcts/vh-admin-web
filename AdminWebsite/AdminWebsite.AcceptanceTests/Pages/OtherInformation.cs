using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class OtherInformation : Common
    {
        private readonly By _otherInformation = By.Id("details-other-information");
        private readonly By _otherInformationText = By.Id("other-information-text");
        public OtherInformation(BrowserContext browserContext) : base(browserContext)
        {
        }
        public void AddOtherInformation(string information) => ClearFieldInputValues(_otherInformation, information);
        public string GetOtherInformationHeading() => GetElementText(_otherInformationText);
    }
}