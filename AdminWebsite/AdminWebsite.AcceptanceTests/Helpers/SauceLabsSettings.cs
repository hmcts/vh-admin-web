

using Microsoft.Extensions.Configuration;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public class SauceLabsSettings
    {
        //public SauceLabsSettings()
        //{
        //    var builder = new ConfigurationBuilder()
        //        .AddJsonFile("appsettings.json", false, true)
        //        .AddEnvironmentVariables();

        //    builder.Build().GetSection("Saucelabs").Bind(this);

        //    if (RunWithSaucelabs)
        //    {
        //        RemoteServerUrl = "http://" + Username + ":" + AccessKey + "@ondemand.saucelabs.com:80/wd/hub";
        //    }
        //}

        //public bool RunWithSaucelabs => !string.IsNullOrEmpty(Username) && !string.IsNullOrEmpty(AccessKey);

        //public string Username { get; set; }

        //public string AccessKey { get; set; }

        ///// <summary>Url for connecting using RemoteWebDriver</summary>
        //public readonly string RemoteServerUrl;
    }
}
