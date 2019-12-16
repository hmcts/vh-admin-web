using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class BookingDetailsPage
    {
        public By CaseNumberTitle = By.Id("hearingNumber");
        public By CreatedBy = By.Id("created-by");
        public By CreatedDate = By.Id("created-date");
        public By CaseNumber = By.Id("hearing-number");
        public By CaseName = By.Id("hearing-name");
        public By HearingType = By.Id("hearing-type");
        public By HearingStartDate = By.Id("hearing-start");
        public By CourtroomAddress = By.Id("court-room-address");
        public By Duration = By.Id("duration");
        public By OtherInformation = By.Id("otherInformation");
        public By EditButton = By.Id("edit-button");
        public By CancelButton = By.Id("cancel-button");
        public By ConfirmCancelButton = By.Id("btnCancelBooking");
        public By ConfirmButton = By.Id("confirm-button");
        public By ConfirmedLabel = By.Id("lblCreated");
        public By JudgeName = By.Id("judge-name");
        public By JudgeEmail = By.XPath("//div[@id='participant_emailundefined']/div[2]");
        public By JudgeUsername = By.XPath("//div[@id='participant_userNameundefined']/div[2]");
        public By ParticipantName(int index) => By.XPath($"//div[@id='participant_role{index}']/parent::div");
        public By ParticipantRole(int index) => By.Id($"participant_role{index}");
        public By ParticipantEmail(int index) => By.XPath($"//div[@id='participant_email{index}']/div[2]");
        public By ParticipantUsername(int index) => By.XPath($"//div[@id='participant_userName{index}']/div[2]");
    }
}
