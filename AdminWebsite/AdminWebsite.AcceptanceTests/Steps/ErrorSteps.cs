using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class ErrorSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly ErrorPage _errorPage;
        private readonly LoginSteps _loginSteps;
        public ErrorSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, LoginSteps loginSteps, ErrorPage errorPage)
        {
            _c = testContext;
            _browsers = browsers;
            _loginSteps = loginSteps;
            _errorPage = errorPage;
        }

        [When(@"the user attempts to access the page on their unsupported browser")]
        public void WhenTheUserAttemptsToAccessThePageOnTheirUnsupportedBrowser()
        {
            _loginSteps.ProgressToNextPage();
        }

        [Then(@"the user is on the Unsupported Browser error page with text of how to rectify the problem")]
        public void ThenTheUserIsOnTheUnsupportedBrowserErrorPageWithTextOfHowToRectifyTheProblem()
        {
            _browsers[_c.CurrentUser.Key].Driver.Url.Should().NotContain(Page.Dashboard.Url);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_errorPage.UnsupportedBrowserTitle)
                .Displayed.Should().BeTrue();
        }
    }
}
