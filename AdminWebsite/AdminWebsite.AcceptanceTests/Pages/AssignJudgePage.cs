using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class AssignJudgePage
    {
        public static By JudgeNameDropdown = By.Id("judgeName");
        public static By JudgeDisplayNameTextfield = By.Id("judgeDisplayName");
        public static By NextButton = By.Id("nextButton");
        public static By CancelButton = By.Id("cancelButton");
    }
}
