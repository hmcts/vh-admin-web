using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;
using System;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class SignOut : Common
    {
        public SignOut(Browser browser) : base(browser)
        {
        }
        
        public void SignOutButton() => ClickElement(By.Id("linkSignOut"));
        public string WarningMessage() => GetElementText(By.XPath("//*[@class='content']/h1"));
        public void PopupSignOutButton()
        {
            ClickElement(By.Id("btn-signout"));
            try
            {
                AcceptBrowserAlert();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Browser has no alert: {ex.Message}");
            }
            
        }
        public void PopupContinueButton() => ClickElement(By.Id("btn-cancel"));
    }
}