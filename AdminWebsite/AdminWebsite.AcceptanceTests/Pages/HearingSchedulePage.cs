using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class HearingSchedulePage
    {
        public static By HearingDateTextfield = By.Id("hearingDate");
        public static By HearingStartTimeHourTextfield = By.Id("hearingStartTimeHour");
        public static By HearingStartTimeMinuteTextfield = By.Id("hearingStartTimeMinute");
        public static By HearingDurationHourTextfield = By.Id("hearingDurationHour");
        public static By HearingDurationMinuteTextfield = By.Id("hearingDurationMinute");
        public static By CourtAddressDropdown = By.Id("courtAddress");
        public static By CourtRoomTextfield = By.Id("court-room");
        public static By NextButton = By.Id("nextButton");
        public static By CancelButton = By.Id("cancelButton");
        public static By HearingDateError = By.Id("hearingDate-error");
        public static By HearingTimeError = By.Id("hearingTime-error");
        public static By HearingEndDateTextField = By.Id("endHearingDate");
        public static By MultiDaysCheckBox = By.Id("miltiDaysHearing");
    }
}
