using System;
using AcceptanceTests.Model.Context;
using AcceptanceTests.Model.Role;
using AcceptanceTests.PageObject.Pages.AdminWebsite;
using Coypu;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.NuGet.Steps
{
    [Binding]
    public sealed class DashboardSteps
    {
        private DashboardPage _dashboard;
        private ITestContext _testContext;

        public DashboardSteps(ITestContext testContext, BrowserSession driver)
        {
            _dashboard = new DashboardPage(driver);
            _testContext = testContext;
        }

        [Then(@"the '(.*)' panel is displayed")]
        public void ThenBookAVideoHearingPanelIsDisplayed(string expectedPanelTitle)
        {
            var userContext = _testContext.UserContext;
            switch (_testContext.UserContext.CurrentUser.Role)
            {
                case UserRole.VhOfficer:
                    var vhoPanelexpectedCount = 2;
                    _dashboard.IsPanelElementsCountDisplayed(vhoPanelexpectedCount)
                                    .Should().BeTrue($"{userContext.CurrentUser.Role} users should see '{vhoPanelexpectedCount}' panel elements");
                    _dashboard.IsCorrectPanelTitleDisplayed(expectedPanelTitle)
                                    .Should().BeTrue($"{userContext.CurrentUser.Role} users should see '{expectedPanelTitle}' panel");
                    break;
                case UserRole.CaseAdmin:
                    var cadminPanelexpectedCount = 1;
                    _dashboard.IsPanelElementsCountDisplayed(cadminPanelexpectedCount)
                                    .Should().BeTrue($"{userContext.CurrentUser.Role} users should see '{cadminPanelexpectedCount}' panel elements");
                    _dashboard.IsCorrectPanelTitleDisplayed(expectedPanelTitle)
                                    .Should().BeTrue($"{userContext.CurrentUser.Role} users should see '{expectedPanelTitle}' panel");
                    break;
                default:
                    throw new NotSupportedException($"Role {userContext.CurrentUser.Role} is not currently supported for this case.");

            }
        }
    }
}
