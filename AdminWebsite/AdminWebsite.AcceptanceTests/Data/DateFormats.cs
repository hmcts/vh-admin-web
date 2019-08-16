using AdminWebsite.AcceptanceTests.Helpers;

namespace AdminWebsite.AcceptanceTests.Data
{
    public static class DateFormats
    {
        private const string ChromeHearingDateFormat = "dd-MM-yyyy";
        private const string ChromeEuHearingDateFormat = "MM-dd-yyyy";
        private const string FirefoxHearingDateFormat = "yyyy-MM-dd";

        public static string GetHearingScheduledDate(TargetBrowser browser, bool runningWithSaucelabs)
        {
            if (browser == TargetBrowser.Chrome && runningWithSaucelabs)
                return ChromeEuHearingDateFormat;
            return browser == TargetBrowser.Firefox ? FirefoxHearingDateFormat : ChromeHearingDateFormat;
        }
    }
}
