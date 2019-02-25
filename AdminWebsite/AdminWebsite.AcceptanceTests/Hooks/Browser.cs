using AdminWebsite.AcceptanceTests.Helpers;
using TechTalk.SpecFlow;
using NUnit.Framework;
using System;
using FluentAssertions;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class Browser
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly SauceLabsSettings _saucelabsSettings;
        private readonly ScenarioContext _scenarioContext;
        

        public Browser(BrowserContext browserContext, TestContext context, SauceLabsSettings saucelabsSettings,
            ScenarioContext injectedContext)
        {
            _browserContext = browserContext;
            _context = context;
            _saucelabsSettings = saucelabsSettings;
            _scenarioContext = injectedContext;
        }


        private TargetBrowser GetTargetBrowser()
        {
            TargetBrowser targetTargetBrowser;
            return Enum.TryParse((string)_context.TestDirectory, true, out targetTargetBrowser) ? targetTargetBrowser : TargetBrowser.Chrome;
        }

        [BeforeScenario]
        public void BeforeScenario()
        {
            var appTestContext = TestConfigSettings.GetSettings(); ;
            var environment = new SeleniumEnvironment(_saucelabsSettings, _scenarioContext.ScenarioInfo, GetTargetBrowser());
            _browserContext.BrowserSetup(appTestContext.WebsiteUrl, environment);
            _browserContext.LaunchSite();           
        }

        [AfterScenario]
        public void AfterScenario()
        {
            _browserContext.BrowserTearDown();
        }
    }
}
