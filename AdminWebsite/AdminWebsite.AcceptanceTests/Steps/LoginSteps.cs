using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class LoginSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly MicrosoftLoginPage _loginPage;
        private readonly ScenarioContext _scenarioContext;
        public LoginSteps(BrowserContext browserContext, MicrosoftLoginPage loginPage,
            ScenarioContext injectedContext)
        {
            _browserContext = browserContext;
            _loginPage = loginPage;
            _scenarioContext = injectedContext;
        }
        public void AdminOnMicrosoftLoginPage()
        {
            _browserContext.Retry(() =>
            {
                _browserContext.PageUrl().Should().Contain("login.microsoftonline.com");
            }, 10);
        }
        [Given(@"(.*) logs into Vh-Admin website")]
        [When(@"(.*) logs in with valid credentials")]
        public void UserLogsInWithValidCredentials(string user)
        {
            AdminOnMicrosoftLoginPage();
            var appSecrets = TestConfigSettings.GetSettings();
            var password = appSecrets.UserPassword;
            switch (user)
            {
                case "VH Officer": _loginPage.Logon(appSecrets.VhOfficerFinRemedyCivilMoneyclaims, password);
                    _scenarioContext.Add("Username", appSecrets.VhOfficerFinRemedyCivilMoneyclaims);
                    break;
                case "Case Admin": _loginPage.Logon(appSecrets.CaseAdminCivilMoneyClaims, password);
                    _scenarioContext.Add("Username", appSecrets.CaseAdminCivilMoneyClaims);
                    break;
                case "Non-Admin": _loginPage.Logon(appSecrets.NonAdmin, password);
                    break;
                case "VhOfficerCivilMoneyclaims": _loginPage.Logon(appSecrets.VhOfficerCivilMoneyclaims, password);
                    _scenarioContext.Add("Username", appSecrets.VhOfficerCivilMoneyclaims);
                    break;
                case "CaseAdminFinRemedyCivilMoneyClaims":
                    _loginPage.Logon(appSecrets.CaseAdminFinRemedyCivilMoneyClaims, password);
                    _scenarioContext.Add("Username", appSecrets.CaseAdminFinRemedyCivilMoneyClaims);
                    break;
            }
            _scenarioContext.Add("User", user);
        }
        [Then(@"user should be navigated to sign in screen")]
        public void ThenUserShouldBeNavigatedToSignInScreen()
        {
            _loginPage.SignInTitle();
        }
    }
}