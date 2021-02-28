using AcceptanceTests.Common.Data.TestData;
using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class SummaryPage
    {
        public static By CaseNumber = By.Id("caseNumber");
        public static By CaseName = By.Id("caseName");
        public static By CaseHearingType = By.Id("caseHearingType");
        public static By HearingDate = By.Id("hearingDate");
        public static By CourtAddress = By.Id("courtAddress");
        public static By HearingDuration = By.Id("hearingDuration");
        public static By AudioRecording = By.Id("audioRecording");
        public static By OtherInformation = By.Id("otherInformation");
        public static By Judge = By.Id("judge-name");
        public static By RemoveParticipant = By.Id("btn-remove");
        public static By RemoveInterpreter = By.Id("btnConfirmRemoveInterpreter");
        public static By CancelRemoveParticipant = By.Id("btn-cancel");
        public static By RemoveInterpreterMessage = CommonLocators.ElementContainingText("Removing this participant will also remove their interpreter.");
        public static By ParticipantConfirmationMessage = By.XPath("//h1[contains(text(),'hearing booking')]");
        public static By BookButton = By.Id("bookButton");
        public static By EditScreenLink(string screen) => By.Id($"edit-link{screen.ToLower().Replace(" ", "-")}-id");
        public static By EditParticipantLink(string firstName) => By.XPath($"//div[contains(text(),'{firstName}')]/parent::div/parent::div//a[text()='Edit']");
        public static By RemoveParticipantLink(string firstName) => By.XPath($"//div[contains(text(),'{firstName}')]/parent::div/parent::div//a[text()='Remove']");
        public static By CaseType = By.Id("caseType");
        public static By HearingType = By.Id("caseHearingType");
        public static By VideoAccessPoints(int i) => By.Id($"displayName{i.ToString()}");
        public static By HearingStartDateMultiDays = By.Id("hearingStartDate");
        public static By HearingEndDateMultiDays = By.Id("hearingEndDateTime");
    }
}
