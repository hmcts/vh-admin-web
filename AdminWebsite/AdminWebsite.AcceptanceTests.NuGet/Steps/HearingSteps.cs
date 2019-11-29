using AcceptanceTests.Model.Context;
using AcceptanceTests.Tests.SpecflowTests.Common;
using AcceptanceTests.Tests.SpecflowTests.Common.Steps;

using Coypu;
using TechTalk.SpecFlow;
using static AcceptanceTests.Tests.SpecflowTests.AdminWebsite.Navigation.AddParticipantJourney;
using AcceptanceTests.PageObject.Helpers;

namespace AdminWebsite.AcceptanceTests.NuGet.Steps
{
    [Binding]
    public sealed class HearingSteps : StepsBase
    {
        AddParticipantsJourney _addParticipantsJourney;
        public HearingSteps(AppContextManager appContextManager, ScenarioContext scenarioContext, ITestContext testContext,
                                        BrowserSession driver) : base(appContextManager, scenarioContext, testContext, driver)
        {
        }

        [When(@"I book a hearing with new participants")]
        public void WhenICreateAHearingWithNewParticipants()
        {
            _addParticipantsJourney = new AddParticipantsJourney(_driver);
            //PageNavigator.CompleteJourney(_addParticipantsJourney);

        }

        private void NavigateToPage()
        {
            
        }
    }
}
