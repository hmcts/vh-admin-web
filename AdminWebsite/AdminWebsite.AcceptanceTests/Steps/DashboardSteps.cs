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
        public DashboardSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        public void ProgressToNextPage()
        {
            if (_c.RouteAfterDashboard.Equals(Page.HearingDetails))
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(DashboardPage.BookVideoHearingPanel).Click();
            }
            else if (_c.RouteAfterDashboard.Equals(Page.BookingsList))
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonAdminWebPage.BookingsListLink).Click();
            }
            else
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(DashboardPage.QuestionnaireResultsPanel).Click();
            }
        }

        [Then(@"there are various dashboard options available")]
        public void ThenThereAreVariousDashboardOptionsAvailable()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(DashboardPage.BookVideoHearingPanel)
                .Displayed.Should().BeTrue();
            OnlyVhosCanSeeTheQuestionnaireResults();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonAdminWebPage.DashboardLink)
                .Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonAdminWebPage.BookingsListLink)
                .Displayed.Should().BeTrue();
        }

        private void OnlyVhosCanSeeTheQuestionnaireResults()
        {
            if (_c.CurrentUser.Role.ToLower().Equals("video hearings officer"))
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(DashboardPage.QuestionnaireResultsPanel)
                    .Displayed.Should().BeTrue();
            }
            else
            {
                _browsers[_c.CurrentUser.Key].Driver
                    .WaitUntilElementNotVisible(DashboardPage.QuestionnaireResultsPanel).Should().BeTrue();
            }
        }
    }
}
