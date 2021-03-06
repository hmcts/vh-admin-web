using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class AssignJudgePage
    {
        public static By JudgeNameDropdown = By.Id("judgeName");
        public static By JudgeDisplayNameTextfield = By.Id("judgeDisplayNameFld");
        public static By JudgeEmailTextField = By.Id("judgeEmailFld");
        public static By JudgePhoneTextField = By.Id("judgePhoneFld");
        public static By NextButton = By.Id("nextButton");
        public static By CancelButton = By.Id("cancelButton");
        public static By JudgeEmailId = By.Id("judge-email");
        public static By JudgePhoneId = By.Id("judge-phone");
    }
}
