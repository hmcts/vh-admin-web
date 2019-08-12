using System;
using AdminWebsite.AcceptanceTests.Contexts;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class LoginSteps
    {
        private readonly Browser _browser;
        private readonly MicrosoftLoginPage _loginPage;
        private readonly ScenarioContext _scenarioContext;
        private readonly TestContext _context;

        public LoginSteps(Browser browser, MicrosoftLoginPage loginPage,
            ScenarioContext injectedContext, TestContext context)
        {
            _browser = browser;
            _loginPage = loginPage;
            _scenarioContext = injectedContext;
            _context = context;
        }

        public void UserOnMicrosoftLoginPage()
        {
            _browser.Retry(() => { _browser.PageUrl().Should().Contain("login.microsoftonline.com"); }, 10);
        }

        [Given(@"(.*) logs into Vh-Admin website")]
        [When(@"(.*) logs in with valid credentials")]
        public void UserLogsInWithValidCredentials(string user)
        {
            UserOnMicrosoftLoginPage();

            switch (user)
            {
                case "VH Officer": _context.CurrentUser = _context.GetFinancialRemedyVideoHearingsOfficerUser(); break;
                case "Case Admin": _context.GetCivilMoneyCaseAdminUser(); break;
                case "Non-Admin": _context.GetNonAdminUser(); break;
                case "VhOfficerCivilMoneyclaims": _context.GetCivilMoneyVideoHearingsOfficerUser(); break;
                case "CaseAdminFinRemedyCivilMoneyClaims": _context.GetFinancialRemedyCaseAdminUser(); break;
                default: throw new ArgumentOutOfRangeException($"No user found with user type {user}");
            }

            _loginPage.Logon(_context.CurrentUser.Username, _context.TestUserSecrets.TestUserPassword);
            _scenarioContext.Add("Username", _context.CurrentUser.Username);
            _scenarioContext.Add("User", _context.CurrentUser);
        }

        [Then(@"user should be navigated to sign in screen")]
        public void ThenUserShouldBeNavigatedToSignInScreen()
        {
            _loginPage.SignInTitle();
        }
    }
}