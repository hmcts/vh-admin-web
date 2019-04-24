using AdminWebsite.AcceptanceTests.Helpers;
using TechTalk.SpecFlow;
using NUnit.Framework;
using System;
using AdminWebsite.AcceptanceTests.Contexts;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class Browser
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly SauceLabsSettings _saucelabsSettings;
        private readonly ScenarioContext _scenarioContext;
        private readonly TestsContext _testContext;
        

        public Browser(BrowserContext browserContext, TestContext context, SauceLabsSettings saucelabsSettings,
            ScenarioContext injectedContext, TestsContext testContext)
        {
            _browserContext = browserContext;
            _context = context;
            _saucelabsSettings = saucelabsSettings;
            _scenarioContext = injectedContext;
            _testContext = testContext;
        }


        private TargetBrowser GetTargetBrowser()
        {
            TargetBrowser targetTargetBrowser;
            return Enum.TryParse(TestContext.Parameters["TargetBrowser"], true, out targetTargetBrowser) ? targetTargetBrowser : TargetBrowser.Chrome;
        }

        [BeforeScenario (Order = 2)]
        public void BeforeScenario()
        {
            var appTestContext = _testContext.AzureAd;
            var environment = new SeleniumEnvironment(_saucelabsSettings, _scenarioContext.ScenarioInfo, GetTargetBrowser());
            _browserContext.BrowserSetup(appTestContext.RedirectUri, environment);
            _browserContext.LaunchSite();           
        }

        [AfterScenario]
        public void AfterScenario()
        {
            if (_saucelabsSettings.RunWithSaucelabs)
            {
                bool passed = _scenarioContext.TestError == null;
                SaucelabsResult.LogPassed(passed, _browserContext.NgDriver);
            }
            _browserContext.BrowserTearDown();
        }
    }
}