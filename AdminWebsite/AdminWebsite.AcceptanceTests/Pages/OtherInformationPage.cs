using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class OtherInformationPage
    {
        public static By OtherInformationTextfield = By.Id("details-other-information");
        public static By NextButton = By.Id("nextButton");
        public static By CancelButton = By.Id("cancelButton");
        public static By AudioRecordYesRadioButton = By.Id("audio-choice-yes");
        public static By AudioRecordNoRadioButton = By.Id("audio-choice-no");
        public static By AudioRecordingInterpreterMessage = CommonLocators.ElementContainingText("(mandatory for hearings with interpreters)");
    }
}
