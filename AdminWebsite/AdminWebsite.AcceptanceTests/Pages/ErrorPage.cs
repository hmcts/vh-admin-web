using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class ErrorPage
    {
        public By UnsupportedBrowserTitle =
            CommonLocators.ElementContainingText("You've signed in using an unsupported browser");
    }
}
