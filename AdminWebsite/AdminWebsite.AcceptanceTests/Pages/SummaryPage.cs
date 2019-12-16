using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class SummaryPage
    {
        public By CaseNumber = By.Id("caseNumber");
        public By CaseName = By.Id("caseName");
        public By CaseHearingType = By.Id("caseHearingType");
        public By HearingDate = By.Id("hearingDate");
        public By CourtAddress = By.Id("courtAddress");
        public By HearingDuration = By.Id("hearingDuration");
        public By OtherInformation = By.Id("otherInformation");
        public By Judge = By.Id("judge-name");
        public By RemoveParticipant = By.Id("btn-remove");
        public By CancelRemoveParticipant = By.Id("btn-cancel");
        public By ParticipantConfirmationMessage = By.XPath("//h1[contains(text(),'hearing booking')]");
        public By EditHearingDetails = By.Id("edit-linkhearing-details-id");
        public By EditScheduleDetails = By.Id("edit-linkhearing-schedule-id");
        public By EditMoreInformation = By.Id("edit-linkother-information-id");
        public By BookButton = By.Id("bookButton");
    }
}
