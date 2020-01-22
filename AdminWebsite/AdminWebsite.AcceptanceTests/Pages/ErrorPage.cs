using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class ErrorPage
    {
        public static By UnsupportedBrowserTitle = CommonLocators.ElementContainingText("You've signed in using an unsupported browser");
    }
}
