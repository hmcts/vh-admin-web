using AdminWebsite.AcceptanceTests.Helpers;
using TechTalk.SpecFlow;
using System;
using TestContext = AdminWebsite.AcceptanceTests.Contexts.TestContext;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class Browser
    {
        private readonly Helpers.Browser _browser;
        private readonly SauceLabsSettings _saucelabsSettings;
        private readonly ScenarioContext _scenarioContext;
        private readonly TestContext _context;
       
        public Browser(Helpers.Browser browser, SauceLabsSettings saucelabsSettings,
            ScenarioContext injectedContext, TestContext context)
        {
            _browser = browser;
            _saucelabsSettings = saucelabsSettings;
            _scenarioContext = injectedContext;
            _context = context;
        }

        private static TargetBrowser GetTargetBrowser()
        {
            return Enum.TryParse(NUnit.Framework.TestContext.Parameters["TargetBrowser"], true, out TargetBrowser targetTargetBrowser) ? targetTargetBrowser : TargetBrowser.Chrome;
        }

        [BeforeScenario (Order = 3)]
        public void BeforeScenario()
        {
            var appTestContext = _context.AzureAd;
            var environment = new SeleniumEnvironment(_saucelabsSettings, _scenarioContext.ScenarioInfo, GetTargetBrowser());
            _browser.BrowserSetup(appTestContext.RedirectUri, environment);
            _browser.LaunchSite();           
        }

        [AfterScenario]
        public void AfterScenario()
        {
            if (_saucelabsSettings.RunWithSaucelabs)
            {
                var passed = _scenarioContext.TestError == null;
                SaucelabsResult.LogPassed(passed, _browser.NgDriver);
            }
            _browser.BrowserTearDown();
        }
    }
}