using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class BookingConfirmationPage
    {
        public static By SuccessMessage = CommonLocators.ElementContainingText("Your hearing booking was successful");
        public static By CaseNumber = By.Id("caseNumber");
        public static By CaseName = By.Id("caseName");
        public static By HearingDate = By.Id("hearingDate");
        public static By BookAnotherHearingButton = By.Id("btnBookAnotherHearing");
        public static By ReturnToDashboardLink = By.PartialLinkText("Return to dashboard");
    }
}
