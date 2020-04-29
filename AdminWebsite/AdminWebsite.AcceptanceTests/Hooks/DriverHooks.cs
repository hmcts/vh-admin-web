using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Support;
using AdminWebsite.AcceptanceTests.Helpers;
using BoDi;
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
        public void ConfigureDriver(TestContext context, ScenarioContext scenario)
        {
            DriverManager.KillAnyLocalDriverProcesses();
            var browserAndVersion = GetBrowserAndVersion();
            context.AdminWebConfig.TestConfig.TargetBrowser = GetTargetBrowser(browserAndVersion);
            context.AdminWebConfig.TestConfig.TargetDevice = DriverManager.GetTargetDevice(NUnit.Framework.TestContext.Parameters["TargetDevice"]);

            var driverOptions = new DriverOptions()
            {
                TargetBrowser = context.AdminWebConfig.TestConfig.TargetBrowser,
                TargetDevice = context.AdminWebConfig.TestConfig.TargetDevice
            };

            var sauceLabsOptions = new SauceLabsOptions()
            {
                BrowserVersion = GetBrowserVersion(browserAndVersion),
                EnableLogging = EnableLogging(scenario.ScenarioInfo),
                Title = scenario.ScenarioInfo.Title
            };
            context.Driver = new DriverSetup(context.AdminWebConfig.SauceLabsConfiguration, driverOptions, sauceLabsOptions);
        }

        private static string GetBrowserAndVersion()
        {
            return NUnit.Framework.TestContext.Parameters["TargetBrowser"] ?? "";
        }

        private static TargetBrowser GetTargetBrowser(string browserAndVersion)
        {
            return DriverManager.GetTargetBrowser(browserAndVersion.Contains(":") ? browserAndVersion.Split(":")[0] : browserAndVersion);
        }

        private static string GetBrowserVersion(string browserAndVersion)
        {
            return browserAndVersion.Contains(":") ? browserAndVersion.Split(":")[1] : "latest";
        }

        private static bool EnableLogging(ScenarioInfo scenario)
        {
            return !scenario.Tags.Contains("DisableLogging");
        }


        [AfterScenario(Order = (int)HooksSequence.LogResultHooks)]
        public void LogResult(TestContext context, ScenarioContext scenarioContext)
        {
            if (_browsers == null) return;
            if (_browsers.Count.Equals(0))
            {
                context.CurrentUser = UserManager.GetDefaultParticipantUser(context.UserAccounts);
                var browser = new UserBrowser()
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
