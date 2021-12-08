using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class AssignJudgePage
    {
        public static By JudgeSearchField = By.Id("judge-email");
        public static By JudgeDisplayNameTextfield = By.Id("judgeDisplayNameFld");
        public static By JudgeEmailTextField = By.Id("judgeEmailFld");
        public static By JudgePhoneTextField = By.Id("judgePhoneFld");
        public static By NextButton = By.Id("nextButton");
        public static By CancelButton = By.Id("cancelButton");
        public static By JudgeEmailId = By.Id("judge-email");
        public static By JudgePhoneId = By.Id("judge-phone");
        public static By SearchResults = By.Id("search-results-list");

        public static By AddStaffMember = By.Id("showAddStaffMemberFld");
        public static By AddStaffEmailTextField = By.Id("staff-member-email");
        public static By AddStaffFirstNameTextField = By.Id("firstName");
        public static By AddStaffLastNameTextField = By.Id("lastName");
        public static By AddStaffPhoneTextField = By.Id("phone");
        public static By AddStaffDisplayNameTextField = By.Id("displayName");

    }
}
