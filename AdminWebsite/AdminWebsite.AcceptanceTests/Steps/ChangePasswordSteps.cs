﻿using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.PageObject.Pages;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using TestApi.Contract.Dtos;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class ChangePasswordSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly BrowserSteps _browserSteps;
        private LoginSharedSteps _loginSteps;

        private UserDto _participant;

        public ChangePasswordSteps(TestContext c, Dictionary<UserDto, UserBrowser> browsers, BrowserSteps browserSteps)
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
        }

        [When(@"the participant accesses the application using the reset password")]
        public void WhenTheParticipantAccessesTheApplicationUsingTheResetPassword()
        {
            _browserSteps.GivenANewBrowserIsOpenFor(_participant.LastName);
            _loginSteps = new LoginSharedSteps(_browsers[_c.CurrentUser], _c.CurrentUser.Username, _c.WebConfig.AzureAdConfiguration.TemporaryPassword);
            _loginSteps.ProgressToNextPage();
        }

        [Then(@"the user is prompted to change their password")]
        public void ThenTheUserIsPromptedToChangeTheirPassword()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(LoginPage.CurrentPassword).Displayed.Should().BeTrue();
        }

        [Then(@"the changed password message can be dismissed")]
        public void ThenTheChangedPasswordMessageCanBeDismissed()
        {
            _browsers[_c.CurrentUser].Click(ChangePasswordPage.OkButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(ChangePasswordPage.PasswordHasBeenChangedMessage);
        }

        [When(@"the user changes their password")]
        public void WhenTheUserChangesTheirPassword()
        {
            _loginSteps.ChangeThePassword(_c.WebConfig.AzureAdConfiguration.TemporaryPassword, _c.WebConfig.TestConfig.TestUserPassword);
        }
    }
}
