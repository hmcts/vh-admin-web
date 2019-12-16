using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class HearingDetailsPage
    {
        public By CaseNumberTextfield = By.Id("caseNumber");
        public By CaseNameTextfield = By.Id("caseName");
        public By CaseTypeDropdown = By.Id("caseType");
        public By HearingTypeDropdown = By.Id("hearingType");
        public By SendQuestionnairesCheckbox = By.Id("questionnaireNotRequired");
        public By NextButton = By.Id("nextButton");
        public By CancelButton = By.Id("cancelButton");
    }
}
