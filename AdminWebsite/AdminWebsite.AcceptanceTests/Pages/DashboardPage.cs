using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class DashboardPage
    {
        public static By BookVideoHearingPanel = By.Id("bookHearingBtn");
        public static By QuestionnaireResultsPanel = By.Id("questionnaireResultsBtn");
        public static By GetAudioFilePanel = By.Id("getAudioLinkBtn");
        public static By ChangePasswordPanel = By.Id("changePasswordBtn");
        public static By DeleteUserPanel = By.Id("deleteUserBtn");
        public static By EditParticipantName = By.Id("editUserBtn");
    }
}
