using TechTalk.SpecFlow;
using AcceptanceTests.Model.Context;
using Coypu;
using AcceptanceTests.PageObject.Helpers;
using AcceptanceTests.Tests.SpecflowTests.Common.Steps;
using AcceptanceTests.Tests.SpecflowTests.Common;

namespace AdminWebsite.AcceptanceTests.NuGet.Steps
{
    [Binding]
    public class SignInSteps : StepsBase
    {
        public SignInSteps(AppContextManager appContextManager, ScenarioContext scenarioContext, ITestContext testContext, BrowserSession driver)
            : base(appContextManager, scenarioContext, testContext, driver)
        {
        }

        [When("I sign in to the '(.*)' using my account details")]
        public void WhenISignInToTheWebsiteUsingMyAccountDetails(string targetApp)
        {
            _testContext = _appContextManager.SwitchTargetAppContext(targetApp, _testContext);
            _driver.Visit(_testContext.BaseUrl);
            _testContext.UserContext.CurrentUser = UserHelper.SetCurrentUser(_testContext,
                                                                             _testContext.UserContext.CurrentUser.Role.ToString());
            SignInHelper.SignIn(_driver, _testContext);
        }
    }
}
