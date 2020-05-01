using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class ChangePasswordPage
    {
        public static By UsernameTextfield = By.Id("userName");
        public static By UpdateButton = By.Id("submit");
        public static By PasswordHasBeenChangedMessage = CommonLocators.ElementContainingText("User's password has been changed");
        public static By OkButton = By.Id("btnOkay");
    }
}
