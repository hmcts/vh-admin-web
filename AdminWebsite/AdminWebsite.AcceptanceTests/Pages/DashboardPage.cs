using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class DashboardPage
    {
        public static By BookVideoHearingPanel = By.Id("vhpanel-green");
        public static By QuestionnaireResultsPanel = By.Id("vhpanel-blue");
        public static By ChangePasswordPanel = By.Id("vhpanel-purple");
    }
}
