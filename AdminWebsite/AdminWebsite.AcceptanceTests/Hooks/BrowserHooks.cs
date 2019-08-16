using AdminWebsite.AcceptanceTests.Helpers;
using TechTalk.SpecFlow;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using AdminWebsite.AcceptanceTests.Contexts;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class BrowserHooks
    {
        private readonly Browser _browser;
        private readonly SauceLabsSettings _saucelabsSettings;
        private readonly ScenarioContext _scenario;
        private readonly TestContext _context;
       
        public BrowserHooks(Browser browser, SauceLabsSettings saucelabsSettings,
            ScenarioContext scenario, TestContext context)
        {
            _browser = browser;
            _saucelabsSettings = saucelabsSettings;
            _scenario = scenario;
            _context = context;
        }

        private static void SetTargetBrowser(TestContext context)
        {
            context.TargetBrowser = Enum.TryParse(NUnit.Framework.TestContext.Parameters["TargetBrowser"], true, out TargetBrowser targetTargetBrowser) ? targetTargetBrowser : TargetBrowser.Chrome;
        }

        [BeforeScenario (Order = 3)]
        public void BeforeScenario()
        {
            var appTestContext = _context.AzureAd;
            SetTargetBrowser(_context);
            var environment = new SeleniumEnvironment(_saucelabsSettings, _scenario.ScenarioInfo, _context.TargetBrowser);
            _context.RunWithSaucelabs = _saucelabsSettings.RunWithSaucelabs;
            _browser.BrowserSetup(appTestContext.RedirectUri, environment);
            _browser.LaunchSite();           
        }

        [AfterScenario]
        public void AfterScenario()
        {
            if (_saucelabsSettings.RunWithSaucelabs)
            {
                var passed = _scenario.TestError == null;
                SaucelabsResult.LogPassed(passed, _browser.NgDriver);
            }

            _browser.BrowserTearDown();

            KillDriverProcesses(Process.GetProcessesByName("ChromeDriver"));
            KillDriverProcesses(Process.GetProcessesByName("GeckoDriver"));
        }

        private static void KillDriverProcesses(IEnumerable<Process> processes)
        {
            foreach (var process in processes)
            {
                try
                {
                    process.Kill();
                }
                catch (Exception ex)
                {
                    NUnit.Framework.TestContext.WriteLine(ex.Message);
                }
            }
        }
    }
}