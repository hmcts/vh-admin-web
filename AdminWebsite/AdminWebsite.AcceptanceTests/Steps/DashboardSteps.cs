using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
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
        private readonly DashboardPage _dashboardPage;
        private readonly CommonAdminWebPage _commonAdminWebPage;
        public DashboardSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, DashboardPage dashboardPage, CommonAdminWebPage commonAdminWebPage)
        {
            _c = testContext;
            _browsers = browsers;
            _dashboardPage = dashboardPage;
            _commonAdminWebPage = commonAdminWebPage;
        }

        public void ProgressToNextPage()
        {
            if (_c.RouteAfterDashboard.Equals(Page.HearingDetails))
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_dashboardPage.BookVideoHearingPanel).Click();
            }
            else if (_c.RouteAfterDashboard.Equals(Page.BookingsList))
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_commonAdminWebPage.BookingsListLink).Click();
            }
            else
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_dashboardPage.QuestionnaireResultsPanel).Click();
            }
        }

        [Then(@"there are various dashboard options available")]
        public void ThenThereAreVariousDashboardOptionsAvailable()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_dashboardPage.BookVideoHearingPanel)
                .Displayed.Should().BeTrue();
            OnlyVhosCanSeeTheQuestionnaireResults();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_commonAdminWebPage.DashboardLink)
                .Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_commonAdminWebPage.BookingsListLink)
                .Displayed.Should().BeTrue();
        }

        private void OnlyVhosCanSeeTheQuestionnaireResults()
        {
            if (_c.CurrentUser.Role.ToLower().Equals("video hearings officer"))
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_dashboardPage.QuestionnaireResultsPanel)
                    .Displayed.Should().BeTrue();
            }
            else
            {
                _browsers[_c.CurrentUser.Key].Driver
                    .WaitUntilElementNotVisible(_dashboardPage.QuestionnaireResultsPanel).Should().BeTrue();
            }
        }
    }
}
