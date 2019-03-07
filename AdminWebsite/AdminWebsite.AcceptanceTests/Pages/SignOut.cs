using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;
using System;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class SignOut : Common
    {
        public SignOut(BrowserContext browserContext) : base(browserContext)
        {
        }

        private readonly By _signOut = By.Id("linkSignOut");
        private readonly By _warningMessage = By.XPath("//*[@class='govuk-heading-m'and contains(text(),'booking')]");
        private readonly By _popupSignOut = By.XPath("//input[@id='btn-signout']");
        private readonly By _popupContinue = By.Id("btn-cancel");
        public void SignOutButton() => ClickElement(_signOut);
        public string WarningMessage() => GetElementText(_warningMessage);
        public void PopupSignOutButton()
        {
            ClickElement(_popupSignOut);
            try
            {
                AcceptBrowserAlert();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Browser has no alert: {ex.Message}");
            }
            
        }
        public void PopupContinueButton() => ClickElement(_popupContinue);
    }
}
