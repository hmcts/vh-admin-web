using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class BookingConfirmationPage
    {
        public By SuccessMessage = CommonLocators.ElementContainingText("Your hearing booking was successful");
        public By CaseNumber = By.Id("caseNumber");
        public By CaseName = By.Id("caseName");
        public By HearingDate = By.Id("hearingDate");
        public By BookAnotherHearingButton = By.Id("btnBookAnotherHearing");
        public By ReturnToDashboardLink = By.PartialLinkText("Return to dashboard");
    }
}
