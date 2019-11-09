using OpenQA.Selenium;
using OpenQA.Selenium.Firefox;
using OpenQA.Selenium.Remote;
using System;
using System.Reflection;
using OpenQA.Selenium.Chrome;
using TechTalk.SpecFlow;
using System.IO;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public class SeleniumEnvironment
    {
        private readonly SauceLabsSettings _saucelabsSettings;
        private readonly ScenarioInfo _scenario;
        private readonly TargetBrowser _targetBrowser;

        public SeleniumEnvironment(SauceLabsSettings saucelabsSettings, ScenarioInfo scenario, TargetBrowser targetBrowser)
        {
            _saucelabsSettings = saucelabsSettings;
            _scenario = scenario;
            _targetBrowser = targetBrowser;
        }

        public IWebDriver GetDriver()
        {
            return _saucelabsSettings.RunWithSaucelabs ? InitSauceLabsDriver() : InitLocalDriver();
        }

        private IWebDriver InitSauceLabsDriver()
        {
#pragma warning disable 618
// disable warning of using desired capabilities

            var caps = new DesiredCapabilities();
            switch (_targetBrowser)
            {
                case TargetBrowser.Firefox:
                    caps.SetCapability("browserName", "Firefox");
                    caps.SetCapability("platform", "Windows 10");
                    caps.SetCapability("version", "64.0");
                    break;
                case TargetBrowser.IE11:
                    caps.SetCapability("browserName", "Internet Explorer");
                    caps.SetCapability("platform", "Windows 10");
                    caps.SetCapability("version", "11.285");
                    break;
                default:
                    caps.SetCapability("browserName", "Chrome");
                    caps.SetCapability("platform", "Windows 10");
                    caps.SetCapability("version", "74.0");
                    caps.SetCapability("autoAcceptAlerts", true);
                    break;
            }

            caps.SetCapability("name", _scenario.Title);
            caps.SetCapability("build", $"{Environment.GetEnvironmentVariable("Build_DefinitionName")} {Environment.GetEnvironmentVariable("RELEASE_RELEASENAME")}");
#pragma warning restore 618

            // It can take quite a bit of time for some commands to execute remotely so this is higher than default
            var commandTimeout = TimeSpan.FromMinutes(1.5);

            var remoteUrl = new Uri(_saucelabsSettings.RemoteServerUrl);

            return new RemoteWebDriver(remoteUrl, caps, commandTimeout);
        }

        private IWebDriver InitLocalDriver()
        {
            if (_targetBrowser == TargetBrowser.Firefox)
            {
                var firefoxOptions = new FirefoxOptions
                {
                    AcceptInsecureCertificates = true
                };
                return new FirefoxDriver(GetBuildPath, firefoxOptions);
            }

            var chromeOptions = new ChromeOptions();
            chromeOptions.AddArgument("ignore -certificate-errors");
            var commandTimeout = TimeSpan.FromSeconds(30);
            return new ChromeDriver(GetBuildPath, chromeOptions, commandTimeout);
        }

        private static string GetBuildPath
        {
            get
            {
                var path = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
                return path;
            }
        }
    }
}
