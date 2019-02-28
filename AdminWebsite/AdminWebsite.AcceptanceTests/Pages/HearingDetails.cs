using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class HearingDetails : Common
    {
        public HearingDetails(BrowserContext browserContext) : base(browserContext)
        {
        }
        private By _caseNumber => By.Id("caseNumber");
        private By _caseName => By.Id("caseName");
        //No dropdown for single casetype
        private By _caseType => By.XPath("//*[@class='govuk-heading-s']");
        public void CaseNumber(string value) => InputValues(_caseNumber, value);
        public void CaseName(string value) => InputValues(_caseName, value);
        public void CaseTypes(string option) => SelectOption(CommonLocator.List("caseType"), option);
        public string CaseType() => GetElementText(_caseType);
        public void HearingType() => SelectOption(CommonLocator.List("hearingType"));
        public void HearingChannel(string option) => SelectOption(CommonLocator.List("hearingMethod"), option);
    }
}