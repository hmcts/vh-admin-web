using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class BookingDetailsPage
    {
        public static By CaseNumberTitle = By.Id("hearingNumber");
        public static By CreatedBy = By.Id("created-by");
        public static By CreatedDate = By.Id("created-date");
        public static By CaseNumber = By.Id("hearing-number");
        public static By CaseName = By.Id("hearing-name");
        public static By HearingType = By.Id("hearing-type");
        public static By HearingStartDate = By.Id("hearing-start");
        public static By CourtroomAddress = By.Id("court-room-address");
        public static By Duration = By.Id("duration");
        public static By OtherInformation = By.Id("otherInformation");
        public static By EditButton = By.Id("edit-button");
        public static By CancelButton = By.Id("cancel-button");
        public static By ConfirmCancelButton = By.Id("btnCancelBooking");
        public static By ConfirmButton = By.Id("confirm-button");
        public static By ConfirmedLabel = By.Id("lblCreated");
        public static By JudgeName = By.Id("judge-name");
        public static By JudgeEmail = By.XPath("//div[@id='participant_emailundefined']/div[2]");
        public static By JudgeUsername = By.XPath("//div[@id='participant_userNameundefined']/div[2]");
        public static By ParticipantName(int index) => By.XPath($"//div[@id='participant_role{index}']/parent::div");
        public static By ParticipantRole(int index) => By.Id($"participant_role{index}");
        public static By ParticipantEmail(int index) => By.XPath($"//div[@id='participant_email{index}']/div[2]");
        public static By ParticipantUsername(int index) => By.XPath($"//div[@id='participant_userName{index}']/div[2]");
    }
}
