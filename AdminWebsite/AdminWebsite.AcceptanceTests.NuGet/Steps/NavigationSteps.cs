using AcceptanceTests.Model.Context;
using AcceptanceTests.PageObject.Pages.AdminWebsite;
using AcceptanceTests.Tests.SpecflowTests.Common;
using AcceptanceTests.Tests.SpecflowTests.Common.Steps;
using Coypu;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.NuGet.Steps
{
    public class NavigationSteps : StepsBase
    {
        AddParticipants _addParticipantsPage;

        public NavigationSteps(AppContextManager appContextManager, ScenarioContext scenarioContext, ITestContext testContext,
                                    BrowserSession driver) : base(appContextManager, scenarioContext, testContext, driver)
        {
        }
    }
}
