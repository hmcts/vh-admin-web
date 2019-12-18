using AcceptanceTests.Common.Driver.Support;

namespace AdminWebsite.AcceptanceTests.Data
{
    public static class DateFormats
    {
        private static readonly string ChromeHearingDateFormat = System.Globalization.CultureInfo.CurrentCulture.DateTimeFormat.ShortDatePattern;
        private const string FirefoxHearingDateFormat = "yyyy-MM-dd";
        public static string HearingSummaryDate = "dddd dd MMMM yyyy, h:mmtt";

        public static string FormatDateToLocalDateFormat(TargetBrowser browser, bool runningWithSauceLabs)
        {
            if (browser == TargetBrowser.Chrome)
                return ChromeHearingDateFormat;
            return browser == TargetBrowser.Firefox ? FirefoxHearingDateFormat : ChromeHearingDateFormat;
        }
    }
}
