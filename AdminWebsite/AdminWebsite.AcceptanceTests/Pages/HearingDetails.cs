using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;
using System.Collections.Generic;
using System.Linq;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class HearingDetails : Common
    {
        public HearingDetails(BrowserContext browserContext) : base(browserContext)
        {
        }
        private By _caseNumber => By.Id("caseNumber");
        private By _caseName => By.Id("caseName");
        public void CaseNumber(string value) => InputValues(_caseNumber, value);
        public void CaseName(string value) => InputValues(_caseName, value);
        public void CaseTypes() => SelectOption(CommonLocator.List("caseType"));
        public void HearingType() => SelectOption(CommonLocator.List("hearingType"));
        public IEnumerable<IWebElement> CaseTypesList() => GetListOfElements(CommonLocator.List("caseType")); 
    }
}