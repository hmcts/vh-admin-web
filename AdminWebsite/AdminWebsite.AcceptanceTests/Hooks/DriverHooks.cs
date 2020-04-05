using System.Collections.Generic;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Driver.Support;
using AcceptanceTests.Common.PageObject.Pages;
using AdminWebsite.AcceptanceTests.Helpers;
using BoDi;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class DriverHooks
    {
        private Dictionary<string, UserBrowser> _browsers;
        private readonly IObjectContainer _objectContainer;

        public DriverHooks(IObjectContainer objectContainer)
        {
            _objectContainer = objectContainer;
        }

        [BeforeScenario(Order = (int)HooksSequence.InitialiseBrowserHooks)]
        public void InitialiseBrowserContainer()
        {
            _browsers = new Dictionary<string, UserBrowser>();
            _objectContainer.RegisterInstanceAs(_browsers);
        }

        [BeforeScenario(Order = (int)HooksSequence.ConfigureDriverHooks)]
        public void ConfigureDriver(TestContext context, ScenarioContext scenarioContext)
        {
            context.AdminWebConfig.TestConfig.TargetBrowser = DriverManager.GetTargetBrowser(NUnit.Framework.TestContext.Parameters["TargetBrowser"]);
            context.AdminWebConfig.TestConfig.TargetDevice = DriverManager.GetTargetDevice(NUnit.Framework.TestContext.Parameters["TargetDevice"]);
            DriverManager.KillAnyLocalDriverProcesses();
            context.Driver = new DriverSetup(context.AdminWebConfig.SauceLabsConfiguration, scenarioContext.ScenarioInfo, context.AdminWebConfig.TestConfig.TargetDevice, context.AdminWebConfig.TestConfig.TargetBrowser);
        }

        [AfterScenario(Order = (int)HooksSequence.LogResultHooks)]
        public void LogResult(TestContext context, ScenarioContext scenarioContext)
        {
            if (_browsers == null) return;
            if (_browsers.Count.Equals(0))
            {
                context.CurrentUser = UserManager.GetDefaultParticipantUser(context.UserAccounts);
                var browser = new UserBrowser(context.CurrentUser)
                    .SetBaseUrl(context.AdminWebConfig.VhServices.AdminWebUrl)
                    .SetTargetBrowser(context.AdminWebConfig.TestConfig.TargetBrowser)
                    .SetDriver(context.Driver);
                _browsers.Add(context.CurrentUser.Key, browser);
            }

            DriverManager.LogTestResult(
                context.AdminWebConfig.SauceLabsConfiguration.RunningOnSauceLabs(),
                _browsers[context.CurrentUser.Key].Driver,
                scenarioContext.TestError == null);
        }

        [AfterScenario(Order = (int)HooksSequence.TearDownBrowserHooks)]
        public void TearDownBrowser()
        {
            if (_browsers != null)
                DriverManager.TearDownBrowsers(_browsers);

            DriverManager.KillAnyLocalDriverProcesses();
        }

        [AfterScenario(Order = (int)HooksSequence.StopEdgeChromiumServer)]
        public void StopEdgeChromiumServer(TestContext context)
        {
            var targetBrowser = GetTargetBrowser();
            if (targetBrowser.ToLower().Equals(TargetBrowser.EdgeChromium.ToString().ToLower()) &&
                !context.AdminWebConfig.SauceLabsConfiguration.RunningOnSauceLabs())
                _browsers?[context.CurrentUser.Key].StopEdgeChromiumServer();
        }

        private static string GetTargetBrowser()
        {
            return NUnit.Framework.TestContext.Parameters["TargetBrowser"] ?? "";
        }
    }
}
