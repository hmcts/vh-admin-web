using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class HearingDetailsPage
    {
        public static By CaseNumberTextfield = By.Id("caseNumber");
        public static By CaseNameTextfield = By.Id("caseName");
        public static By CaseTypeDropdown = By.Id("caseType");
        public static By HearingTypeDropdown = By.Id("hearingType");
        public static By NextButton = By.Id("nextButton");
        public static By CancelButton = By.Id("cancelButton");
    }
}
