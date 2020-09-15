using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.TestAPI.Client;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class ErrorSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;
        private readonly LoginSteps _loginSteps;
        public ErrorSteps(TestContext testContext, Dictionary<User, UserBrowser> browsers, LoginSteps loginSteps)
        {
            _c = testContext;
            _browsers = browsers;
            _loginSteps = loginSteps;
        }

        [When(@"the user attempts to access the page on their unsupported browser")]
        public void WhenTheUserAttemptsToAccessThePageOnTheirUnsupportedBrowser()
        {
            _loginSteps.ProgressToNextPage();
        }

        [Then(@"the user is on the Unsupported Browser error page with text of how to rectify the problem")]
        public void ThenTheUserIsOnTheUnsupportedBrowserErrorPageWithTextOfHowToRectifyTheProblem()
        {
            _browsers[_c.CurrentUser].Driver.Url.Should().NotContain(Page.Dashboard.Url);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ErrorPage.UnsupportedBrowserTitle).Displayed.Should().BeTrue();
        }
    }
}
