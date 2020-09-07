using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class DashboardSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        public DashboardSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        public void ProgressToNextPage()
        {
            if (_c.Route.Equals(Page.HearingDetails))
            {
                _browsers[_c.CurrentUser.Key].Click(DashboardPage.BookVideoHearingPanel);
            }
            else if (_c.Route.Equals(Page.Questionnaire))
            {
                _browsers[_c.CurrentUser.Key].Click(DashboardPage.QuestionnaireResultsPanel);
            }
            else if (_c.Route.Equals(Page.ChangePassword))
            {
                _browsers[_c.CurrentUser.Key].Click(DashboardPage.ChangePasswordPanel);
            }
            else if (_c.Route.Equals(Page.GetAudioFile))
            {
                _browsers[_c.CurrentUser.Key].Click(DashboardPage.GetAudioFilePanel);
            }
            else if (_c.Route.Equals(Page.DeleteUser))
            {
                _browsers[_c.CurrentUser.Key].Click(DashboardPage.DeleteUserPanel);
            }
            else
            {
                _browsers[_c.CurrentUser.Key].Click(DashboardPage.BookVideoHearingPanel);
            }
        }

        [When(@"the user navigates to the Bookings List page")]
        public void WhenTheUserNavigatesToTheBookingsList()
        {
            _browsers[_c.CurrentUser.Key].Click(CommonAdminWebPage.BookingsListLink);
        }

        [Then(@"there are various dashboard options available")]
        public void ThenThereAreVariousDashboardOptionsAvailable()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(DashboardPage.BookVideoHearingPanel).Displayed.Should().BeTrue();
            OnlyVhosCanSeeTheQuestionnaireResults();
            OnlyVhosCanSeeThePasswordReset();
            OnlyVhosCanSeeTheGetAudioFile();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonAdminWebPage.DashboardLink).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonAdminWebPage.BookingsListLink).Displayed.Should().BeTrue();
        }

        private void OnlyVhosCanSeeTheQuestionnaireResults()
        {
            if (_c.CurrentUser.Role.ToLower().Equals("video hearings officer"))
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(DashboardPage.QuestionnaireResultsPanel).Displayed.Should().BeTrue();
            }
            else
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(DashboardPage.QuestionnaireResultsPanel).Should().BeTrue();
            }
        }

        private void OnlyVhosCanSeeThePasswordReset()
        {
            if (_c.CurrentUser.Role.ToLower().Equals("video hearings officer"))
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(DashboardPage.ChangePasswordPanel).Displayed.Should().BeTrue();
            }
            else
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(DashboardPage.ChangePasswordPanel).Should().BeTrue();
            }
        }

        private void OnlyVhosCanSeeTheGetAudioFile()
        {
            if (_c.CurrentUser.Role.ToLower().Equals("video hearings officer"))
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(DashboardPage.GetAudioFilePanel).Displayed.Should().BeTrue();
            }
            else
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(DashboardPage.GetAudioFilePanel).Should().BeTrue();
            }
        }
    }
}
