﻿using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Enums;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.TestAPI.Client;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class BrowserSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;

        public BrowserSteps(TestContext testContext, Dictionary<User, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        [Given(@"a new browser is open for user (.*)")]
        [Given(@"a new browser is open for the (.*)")]
        [Given(@"a new browser is open for a (.*)")]
        [Given(@"a new browser is open for an (.*)")]
        public void GivenANewBrowserIsOpenFor(string user)
        {
            SwitchCurrentUser(user);

            var browser = new UserBrowser()
                .SetBaseUrl(_c.WebConfig.VhServices.AdminWebUrl)
                .SetTargetBrowser(_c.WebConfig.TestConfig.TargetBrowser)
                .SetTargetDevice(_c.WebConfig.TestConfig.TargetDevice)
                .SetDriver(_c.Driver);

            _browsers.Add(_c.CurrentUser, browser);

            browser.LaunchBrowser();
            browser.NavigateToPage();

            if (_c.WebConfig.TestConfig.TargetBrowser != TargetBrowser.Ie11)
                browser.PageUrl(_c.Test.CommonData.CommonUris.LoginUri);
        }

        [Given(@"in (.*)'s browser")]
        [When(@"in (.*)'s browser")]
        [Then(@"in (.*)'s browser")]
        public void GivenInTheUsersBrowser(string user)
        {
            SwitchCurrentUser(user);

            _browsers[_c.CurrentUser].Driver.SwitchTo().Window(_browsers[_c.CurrentUser].LastWindowName);
        }

        private void SwitchCurrentUser(string user)
        {
            if (_c.CurrentUser != null)
                _browsers[_c.CurrentUser].LastWindowName = _browsers[_c.CurrentUser].Driver.WrappedDriver.WindowHandles.Last();

            if (user.Contains("the"))
            {
                var number = user.Split(" ")[1].Trim();
                _c.CurrentUser = Users.GetUser(_c.Users, number, user);
            }
            else
            {
                _c.CurrentUser = UserIsParticipant(user) ? GetDefaultParticipant() : GetMatchingDisplayName(user);
            }

            if (_c.CurrentUser == null)
                throw new ArgumentOutOfRangeException($"There are no users configured called '{user}'");
        }

        private static bool UserIsParticipant(string user)
        {
            return user.ToLower().Equals("participant");
        }

        private User GetDefaultParticipant()
        {
            return Users.GetDefaultParticipantUser(_c.Users);
        }

        private User GetMatchingDisplayName(string user)
        {
            return Users.GetUserFromDisplayName(_c.Users, user);
        }

        [When(@"switches to the (.*) tab")]
        public void WhenSwitchesToTheNewTab(string url)
        {
            _browsers[_c.CurrentUser].LastWindowName = _browsers[_c.CurrentUser].SwitchTab(url);
        }

        [Then(@"the user is on the (.*) page")]
        public void ThenTheUserIsOnThePage(string page)
        {
            _browsers[_c.CurrentUser].PageUrl(Page.FromString(page).Url);
        }

        [Then(@"the user is not on the (.*) page")]
        public void ThenTheUserIsNotOnThePage(string page)
        {
            _browsers[_c.CurrentUser].PageUrl(page);
        }
    }
}
