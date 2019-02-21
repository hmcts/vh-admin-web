using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using System;
using System.Diagnostics;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public class SeleniumEnvironment
    {
        //private readonly SauceLabsSettings _saucelabsSettings;
        // private readonly ScenarioInfo _scenario;
        //private readonly TargetBrowser _targetBrowser;

        //public SeleniumEnvironment(SauceLabsSettings saucelabsSettings, ScenarioInfo scenario, TargetBrowser targetBrowser)
        //{
        //    _saucelabsSettings = saucelabsSettings;
        //    _scenario = scenario;
        //    _targetBrowser = targetBrowser;
        //}

        public IWebDriver GetDriver()
        {
            //return _saucelabsSettings.RunWithSaucelabs ? InitSauceLabsDriver() : InitLocalDriver();
            return InitLocalDriver();
        }

        //private IWebDriver InitSauceLabsDriver()
        //{
        //    var caps = new DesiredCapabilities();
        //    switch (_targetBrowser)
        //    {
        //        case TargetBrowser.Firefox:
        //            caps.SetCapability("browserName", "Firefox");
        //            caps.SetCapability("platform", "Windows 10");
        //            caps.SetCapability("version", "64.0");
        //            break;
        //        case TargetBrowser.Safari:
        //            caps.SetCapability("browserName", "Safari");
        //            caps.SetCapability("platform", "macOS 10.14");
        //            caps.SetCapability("version", "12.0");
        //            break;
        //        case TargetBrowser.Edge:
        //            caps.SetCapability("browserName", "MicrosoftEdge");
        //            caps.SetCapability("platform", "Windows 10");
        //            caps.SetCapability("version", "16.16299");
        //            break;
        //        case TargetBrowser.IE11:
        //            caps.SetCapability("browserName", "Internet Explorer");
        //            caps.SetCapability("platform", "Windows 10");
        //            caps.SetCapability("version", "11.285");
        //            break;
        //        case TargetBrowser.IPhoneSafari:
        //            caps.SetCapability("appiumVersion", "1.9.1");
        //            caps.SetCapability("deviceName", "iPhone 8 Simulator");
        //            caps.SetCapability("deviceOrientation", "portrait");
        //            caps.SetCapability("platformVersion", "12.0");
        //            caps.SetCapability("platformName", "iOS");
        //            caps.SetCapability("browserName", "Safari");
        //            break;
        //        default:
        //            if (TestMobile || TestTablet)
        //            {
        //                var chromeOptions = new Dictionary<string, object>();
        //                var agent = TestMobile ? MobileUserAgent : TabletUserAgent;
        //                Console.WriteLine("Will be running with chrome using user agent: " + agent);
        //                chromeOptions["args"] = new List<string> { "--user-agent=" + agent };
        //                caps.SetCapability(ChromeOptions.Capability, chromeOptions);
        //            }

        //            caps.SetCapability("browserName", "Chrome");
        //            caps.SetCapability("platform", "Windows 10");
        //            caps.SetCapability("version", "71.0");
        //            break;
        //    }

        //    caps.SetCapability("name", _scenario.Title);
        //    caps.SetCapability("build", Environment.GetEnvironmentVariable("BUILD_BUILDNUMBER"));

        //    // It can take quite a bit of time for some commands to execute remotely so this is higher than default
        //    var commandTimeout = TimeSpan.FromMinutes(3);

        //    var remoteUrl = new System.Uri(_saucelabsSettings.RemoteServerUrl);

        //    return new RemoteWebDriver(remoteUrl, caps, commandTimeout);
        //}

        private IWebDriver InitLocalDriver()
        {
            var chromeDriverProcesses = Process.GetProcessesByName("ChromeDriver");

            foreach (var chromeDriverProcess in chromeDriverProcesses)
            {
                try
                {
                    chromeDriverProcess.Kill();
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                }
            }

            ChromeOptions options = new ChromeOptions();
            options.AddArgument("ignore -certificate-errors");

       
            return new ChromeDriver(options);
        }

        //private bool HasTag(string tagName)
        //{
        //    return _scenario.Tags.Any(tag => tag.Equals(tagName, StringComparison.CurrentCultureIgnoreCase));
        //}

    }
}
