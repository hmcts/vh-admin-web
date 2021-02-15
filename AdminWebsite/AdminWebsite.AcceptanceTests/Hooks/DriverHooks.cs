using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Data.Time;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Settings;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.TestAPI.Client;
using BoDi;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class DriverHooks
    {
        private Dictionary<User, UserBrowser> _browsers;
        private readonly IObjectContainer _objectContainer;

        public DriverHooks(IObjectContainer objectContainer)
        {
            _objectContainer = objectContainer;
        }

        [BeforeTestRun(Order = (int)HooksSequence.CleanUpDriverInstances)]
        [AfterTestRun(Order = (int)HooksSequence.CleanUpDriverInstances)]
        public static void KillAnyLocalProcesses()
        {
            DriverManager.KillAnyLocalDriverProcesses();
        }
        
        [BeforeScenario(Order = (int)HooksSequence.InitialiseBrowserHooks)]
        public void InitialiseBrowserContainer()
        {
            _browsers = new Dictionary<User, UserBrowser>();
            _objectContainer.RegisterInstanceAs(_browsers);
        }

        [BeforeScenario(Order = (int)HooksSequence.ConfigureDriverHooks)]
        public void ConfigureDriver(TestContext context, ScenarioContext scenario)
        {
            context.WebConfig.TestConfig.TargetBrowser = DriverManager.GetTargetBrowser(NUnit.Framework.TestContext.Parameters["TargetBrowser"]);
            context.WebConfig.TestConfig.TargetBrowserVersion = NUnit.Framework.TestContext.Parameters["TargetBrowserVersion"];
            context.WebConfig.TestConfig.TargetDevice = DriverManager.GetTargetDevice(NUnit.Framework.TestContext.Parameters["TargetDevice"]);
            context.WebConfig.TestConfig.TargetDeviceName = NUnit.Framework.TestContext.Parameters["TargetDeviceName"];
            context.WebConfig.TestConfig.TargetOS = DriverManager.GetTargetOS(NUnit.Framework.TestContext.Parameters["TargetOS"]);

            var driverOptions = new DriverOptions()
            {
                TargetBrowser = context.WebConfig.TestConfig.TargetBrowser,
                TargetBrowserVersion = context.WebConfig.TestConfig.TargetBrowserVersion,
                TargetDevice = context.WebConfig.TestConfig.TargetDevice,
                TargetOS = context.WebConfig.TestConfig.TargetOS
            };

            var sauceLabsOptions = new SauceLabsOptions()
            {
                EnableLogging = EnableLogging(),
                Name = scenario.ScenarioInfo.Title
            };

            context.Driver = new DriverSetup(context.WebConfig.SauceLabsConfiguration, driverOptions, sauceLabsOptions);
        }

        [BeforeScenario(Order = (int)HooksSequence.SetTimeZone)]
        public void SetTimeZone(TestContext context)
        {
            context.TimeZone = new TimeZone(context.WebConfig.SauceLabsConfiguration.RunningOnSauceLabs(), context.WebConfig.TestConfig.TargetOS);
        }

        private static bool EnableLogging()
        {
            return false;
        }

        [AfterScenario(Order = (int)HooksSequence.LogResultHooks)]
        public void LogResult(TestContext context, ScenarioContext scenarioContext)
        {
            if (_browsers == null) return;
            if (_browsers.Count.Equals(0))
            {
                context.CurrentUser = Users.GetDefaultParticipantUser(context.Users);
                var browser = new UserBrowser()
                    .SetBaseUrl(context.WebConfig.VhServices.AdminWebUrl)
                    .SetTargetBrowser(context.WebConfig.TestConfig.TargetBrowser)
                    .SetTargetDevice(context.WebConfig.TestConfig.TargetDevice)
                    .SetDriver(context.Driver);
                _browsers.Add(context.CurrentUser, browser);
            }

            DriverManager.LogTestResult(
                context.WebConfig.SauceLabsConfiguration.RunningOnSauceLabs(),
                _browsers[context.CurrentUser].Driver,
                scenarioContext.TestError == null);
        }

        [AfterScenario(Order = (int)HooksSequence.TearDownBrowserHooks)]
        public void TearDownBrowser()
        {
            if (_browsers == null) return;
            foreach (var browser in _browsers.Values)
            {
                browser.BrowserTearDown();
            }
        }
    }
}
