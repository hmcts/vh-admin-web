using AdminWebsite.AcceptanceTests.Configuration;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class DashboardSteps
    {
        private readonly Dashboard _dashboard;
        private readonly ScenarioContext _scenarioContext;

        public DashboardSteps(Dashboard dashboard, ScenarioContext injectedContext)
        {
            _dashboard = dashboard;
            _scenarioContext = injectedContext;
        }

        [Then(@"(.*) panel is displayed")]
        public void ThenBookAVideoHearingPanelIsDisplayed(string panelText)
        {
            var panels = _dashboard.VhPanelTitle();
            switch (_scenarioContext.Get<UserAccount>("User").Role)
            {
                case "VH Officer":
                    panels.Count.Should().Be(2);
                    panels.Should().Contain(panelText);
                    break;
                case "Case Admin":
                    panels.Count.Should().Be(1);
                    panels[0].Should().Be(panelText);
                    break;
            }
        }

        [Then(@"Error message is displayed as (.*)")]
        public void ThenErrorMessageIsDisplayedAsYouAreNotAuthorisedToUseThisService(string errorMessage)
        {
           _dashboard.UnauthorisedText().Should().Be(errorMessage);
        }

        [When(@"book a video hearing panel is selected")]
        public void WhenBookAVideoHearingPanelIsSelected()
        {
            _dashboard.BookHearingPanel();
        }

        [Given(@"user is on dashboard page")]
        public void DashboardPage()
        {
            _dashboard.PageUrl(PageUri.DashboardPage);
        }
    }
}