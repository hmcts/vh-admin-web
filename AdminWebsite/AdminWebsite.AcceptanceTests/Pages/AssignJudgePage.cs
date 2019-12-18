using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class AssignJudgePage
    {
        public By JudgeNameDropdown = By.Id("judgeName");
        public By JudgeDisplayNameTextfield = By.Id("judgeDisplayName");
        public By NextButton = By.Id("nextButton");
        public By CancelButton = By.Id("cancelButton");
    }
}
