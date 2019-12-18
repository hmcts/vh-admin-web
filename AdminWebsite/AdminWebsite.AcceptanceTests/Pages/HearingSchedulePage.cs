using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class HearingSchedulePage
    {
        public By HearingDateTextfield = By.Id("hearingDate");
        public By HearingStartTimeHourTextfield = By.Id("hearingStartTimeHour");
        public By HearingStartTimeMinuteTextfield = By.Id("hearingStartTimeMinute");
        public By HearingDurationHourTextfield = By.Id("hearingDurationHour");
        public By HearingDurationMinuteTextfield = By.Id("hearingDurationMinute");
        public By CourtAddressDropdown = By.Id("courtAddress");
        public By CourtRoomTextfield = By.Id("court-room");
        public By NextButton = By.Id("nextButton");
        public By CancelButton = By.Id("cancelButton");
        public By HearingDateError = By.Id("hearingDate-error");
    }
}
