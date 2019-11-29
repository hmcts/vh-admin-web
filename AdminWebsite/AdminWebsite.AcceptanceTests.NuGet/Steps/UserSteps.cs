using AcceptanceTests.Model;
using AcceptanceTests.Model.Context;
using AcceptanceTests.Model.Role;
using AcceptanceTests.Model.User;
using AcceptanceTests.PageObject.Helpers;
using AcceptanceTests.Tests.SpecflowTests.Common;
using AcceptanceTests.Tests.SpecflowTests.Common.Steps;
using Coypu;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.NuGet.Steps
{
    [Binding]
    public class UserSteps : StepsBase
    {
        public UserSteps(AppContextManager appContextManager, ScenarioContext scenarioContext, ITestContext testContext, BrowserSession driver)
            : base(appContextManager, scenarioContext, testContext, driver)
        {
        }

        [Given(@"I am on the '(.*)' as an authorised '(.*)' user")]
        public void GivenIAmOnTheAsAnAuthorisedUser(string targetApp, string role)
        {
            _testContext = _appContextManager.SwitchTargetAppContext(targetApp, _testContext);
            _testContext.UserContext.CurrentUser = UserHelper.SetCurrentUser(_testContext, role);
            SignInHelper.SignIn(_driver, _testContext);
        }

        [Given(@"I am registered as '(.*)' in the Video Hearings Azure AD")]
        public void GivenIAmRegisteredAsInTheVideoHearingsAzureAD(string role)
        {
            _testContext.UserContext.CurrentUser = new TestUser();
            _testContext.UserContext.CurrentUser.Role = EnumParser.ParseText<UserRole>(role);
        }
    }
}
