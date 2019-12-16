using System.Collections.Generic;
using AcceptanceTests.Common.Driver;
using AcceptanceTests.Common.Driver.Browser;
using AdminWebsite.AcceptanceTests.Helpers;
using BoDi;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class DriverHooks
    {
        private readonly DriverManager _driverManager;
        private Dictionary<string, UserBrowser> _browsers;
        private readonly IObjectContainer _objectContainer;

        public DriverHooks(IObjectContainer objectContainer)
        {
            _objectContainer = objectContainer;
            _driverManager = new DriverManager();
        }

        [BeforeScenario(Order = (int)HooksSequence.InitialiseBrowserHooks)]
        public void InitialiseBrowserContainer()
        {
            _browsers = new Dictionary<string, UserBrowser>();
            _objectContainer.RegisterInstanceAs(_browsers);
        }

        [BeforeScenario(Order = (int)HooksSequence.ConfigureDriverHooks)]
        private void ConfigureDriver(TestContext context, ScenarioContext scenarioContext)
        {
            context.AdminWebConfig.TestConfig.TargetBrowser = _driverManager.GetTargetBrowser();
            context.AdminWebConfig.TestConfig.TargetDevice = _driverManager.GetTargetDevice();
            _driverManager.KillAnyLocalDriverProcesses(context.AdminWebConfig.TestConfig.TargetBrowser, context.AdminWebConfig.SauceLabsConfiguration.RunningOnSauceLabs());
            context.Driver = new DriverSetup(context.AdminWebConfig.SauceLabsConfiguration, scenarioContext.ScenarioInfo, context.AdminWebConfig.TestConfig.TargetBrowser);
        }

        [AfterScenario]
        public void AfterScenario(TestContext context, ScenarioContext scenarioContext)
        {
            _driverManager.RunningOnSauceLabs(context.AdminWebConfig.SauceLabsConfiguration.RunningOnSauceLabs());
            _driverManager.LogTestResult(
                _browsers.Count > 0 ? _browsers[context.CurrentUser.Key].Driver : context.Driver.GetDriver(""),
                scenarioContext.TestError == null);
            _driverManager.TearDownBrowsers(_browsers);
            _driverManager.KillAnyLocalDriverProcesses(context.AdminWebConfig.TestConfig.TargetBrowser, context.AdminWebConfig.SauceLabsConfiguration.RunningOnSauceLabs());
        }
    }
}
