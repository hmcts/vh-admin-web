using AcceptanceTests.Model.Context;
using AcceptanceTests.Tests.SpecflowTests.Common;
using AcceptanceTests.Tests.SpecflowTests.Common.Steps;
using Coypu;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.NuGet.Steps
{
    public class BookingConfirmationSteps : StepsBase
    {
        public BookingConfirmationSteps(AppContextManager appContextManager, ScenarioContext scenarioContext, ITestContext testContext,
                                            BrowserSession driver) : base(appContextManager, scenarioContext, testContext, driver)
        {
        }

        [Then(@"hearing should be booked")]
        public void ThenHearingShouldBeBooked()
        {
            _scenarioContext.Pending();
        }
    }
}
