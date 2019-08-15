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
        private static By RoomTextfield => By.Id("court-room");
        public void CaseNumber(string value) => ClearFieldInputValues(CaseNumberTextfield, value);
        public void CaseName(string value) => ClearFieldInputValues(CaseNameTextfield, value);
        public void CaseTypes() => SelectFirstOption(CommonLocator.List("caseType"));
        public void HearingType() => SelectFirstOption(CommonLocator.List("hearingType"));
        public void QuestionnaireNotRequired() => ClickCheckboxElement(By.Id("questionnaireNotRequired"));

        public IEnumerable<IWebElement> CaseTypesList() => GetListOfElements(CommonLocator.List("caseType"));
        public void CaseTypes(string caseType) => SelectOption(CommonLocator.List("caseType"), caseType);
        public void Room(string value) => ClearFieldInputValues(RoomTextfield, value);
    }
}