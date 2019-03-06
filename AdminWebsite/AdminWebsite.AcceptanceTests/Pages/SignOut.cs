using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class SignOut : Common
    {
        public SignOut(BrowserContext browserContext) : base(browserContext)
        {
        }

        private readonly By _signOut = By.Id("linkSignOut");
        public void SignOutButton() => ClickElement(_signOut);
    }
}
