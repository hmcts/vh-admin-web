using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.PageObject.Pages;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.TestAPI.Client;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class ChangePasswordSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;
        private readonly BrowserSteps _browserSteps;
        private LoginSharedSteps _loginSteps;

        private User _participant;

        public ChangePasswordSteps(TestContext c, Dictionary<User, UserBrowser> browsers, BrowserSteps browserSteps)
        {
            _c = c;
            _browsers = browsers;
            _browserSteps = browserSteps;
        }

        [When(@"the user resets the participants password")]
        public void WhenTheUserResetsTheParticipantsPassword()
        {
            _participant = Users.GetIndividualUser(_c.Users);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ChangePasswordPage.UsernameTextfield).SendKeys(_participant.Username);
            _browsers[_c.CurrentUser].Click(ChangePasswordPage.UpdateButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ChangePasswordPage.PasswordHasBeenChangedMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(ChangePasswordPage.OkButton);
        }

        [When(@"the participant accesses the application using the reset password")]
        public void WhenTheParticipantAccessesTheApplicationUsingTheResetPassword()
        {
            _browserSteps.GivenANewBrowserIsOpenFor(_participant.Last_name);
            _loginSteps = new LoginSharedSteps(_browsers[_c.CurrentUser], _c.CurrentUser.Username, _c.WebConfig.AzureAdConfiguration.TemporaryPassword);
            _loginSteps.ProgressToNextPage();
        }

        [Then(@"the user is prompted to change their password")]
        public void ThenTheUserIsPromptedToChangeTheirPassword()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(LoginPage.CurrentPassword).Displayed.Should().BeTrue();
        }

        [When(@"the user changes their password")]
        public void WhenTheUserChangesTheirPassword()
        {
            _loginSteps.ChangeThePassword(_c.WebConfig.AzureAdConfiguration.TemporaryPassword, _c.WebConfig.TestConfig.TestUserPassword);
        }
    }
}
