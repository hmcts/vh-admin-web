using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;
using System.Collections.Generic;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class HearingDetails : Common
    {
        public HearingDetails(Browser browser) : base(browser)
        {
        }

        private static By CaseNumberTextfield => By.Id("caseNumber");
        private static By CaseNameTextfield => By.Id("caseName");
        public void CaseNumber(string value) => ClearFieldInputValues(CaseNumberTextfield, value);
        public void CaseName(string value) => ClearFieldInputValues(CaseNameTextfield, value);
        public void CaseTypes() => SelectOption(CommonLocator.List("caseType"));
        public void HearingType() => SelectOption(CommonLocator.List("hearingType"));
        public IEnumerable<IWebElement> CaseTypesList() => GetListOfElements(CommonLocator.List("caseType"));
        public void CaseTypes(string caseType) => SelectOption(CommonLocator.List("caseType"), caseType);
    }
}