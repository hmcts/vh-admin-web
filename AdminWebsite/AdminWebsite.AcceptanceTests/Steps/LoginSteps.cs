using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.PageObject.Pages;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using TestApi.Contract.Dtos;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class LoginSteps : ISteps
    {
        private LoginSharedSteps _loginSharedSteps;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;
        private const int ReachedThePageRetries = 2;

        public LoginSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _c = testContext;
        }

        [When(@"the user logs in with valid credentials")]
        public void ProgressToNextPage()
        {
            _loginSharedSteps = new LoginSharedSteps(_browsers[_c.CurrentUser], _c.CurrentUser.Username, _c.WebConfig.TestConfig.TestUserPassword);
            _loginSharedSteps.ProgressToNextPage();
        }

        [Given(@"the user logs out")]
        [When(@"the user attempts to logout")]
        public void WhenTheUserAttemptsToLogout()
        {
            _browsers[_c.CurrentUser].ClickLink(CommonPages.SignOutLink);
        }

        [Then(@"the sign out link is displayed")]
        public void ThenTheSignOutLinkIsDisplayed()
        {
            _loginSharedSteps.ThenTheSignOutLinkIsDisplayed();
        }

        [Then(@"the user should be navigated to sign in screen")]
        public void ThenTheUserShouldBeNavigatedToSignInScreen()
        {
            _browsers[_c.CurrentUser].Retry(() => _browsers[_c.CurrentUser].Driver.Title.Trim().Should().Be(LoginPage.SignInTitle), ReachedThePageRetries);
        }
    }
}
