using System.Collections.Generic;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.PageObject.Pages;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class ChangePasswordSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly BrowserSteps _browserSteps;
        private LoginSharedSteps _loginSteps;

        private UserAccount _participant;

        public ChangePasswordSteps(TestContext c, Dictionary<string, UserBrowser> browsers, BrowserSteps browserSteps)
        {
            _c = c;
            _browsers = browsers;
            _browserSteps = browserSteps;
        }

        [When(@"the user resets the participants password")]
        public void WhenTheUserResetsTheParticipantsPassword()
        {
            _participant = UserManager.GetDefaultParticipantUser(_c.UserAccounts);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ChangePasswordPage.UsernameTextfield).SendKeys(_participant.Username);
            _browsers[_c.CurrentUser.Key].Click(ChangePasswordPage.UpdateButton);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ChangePasswordPage.PasswordHasBeenChangedMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Click(ChangePasswordPage.OkButton);
        }

        [When(@"the participant accesses the application using the reset password")]
        public void WhenTheParticipantAccessesTheApplicationUsingTheResetPassword()
        {
            _browserSteps.GivenANewBrowserIsOpenFor(_participant.DisplayName);
            _loginSteps = new LoginSharedSteps(_browsers[_c.CurrentUser.Key], _c.CurrentUser.Username, _c.AdminWebConfig.AzureAdConfiguration.TemporaryPassword);
            _loginSteps.ProgressToNextPage();
        }

        [Then(@"the user is prompted to change their password")]
        public void ThenTheUserIsPromptedToChangeTheirPassword()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(LoginPage.CurrentPassword).Displayed.Should().BeTrue();
        }

        [When(@"the user changes their password")]
        public void WhenTheUserChangesTheirPassword()
        {
            _loginSteps.ChangeThePassword(_c.AdminWebConfig.AzureAdConfiguration.TemporaryPassword, GenerateRandomPassword());
        }

        private static string GenerateRandomPassword()
        {
            return $"U;6<&'98z,H01sEy{Faker.RandomNumber.Next(1000000, 9999999)}";
        }
    }
}
