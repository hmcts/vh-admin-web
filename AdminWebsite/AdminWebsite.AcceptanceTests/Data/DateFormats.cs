using AcceptanceTests.Common.Driver.Support;

namespace AdminWebsite.AcceptanceTests.Data
{
    public static class DateFormats
    {
        private static string _chromeHearingDateFormat = System.Globalization.CultureInfo.CurrentCulture.DateTimeFormat.ShortDatePattern;
        private const string FirefoxHearingDateFormat = "yyyy-MM-dd";
        public static string HearingSummaryDate = "dddd dd MMMM yyyy, h:mmtt";

        public static string FormatDateToLocalDateFormat(TargetBrowser browser)
        {
            if (browser != TargetBrowser.Chrome)
                return browser == TargetBrowser.Firefox ? FirefoxHearingDateFormat : _chromeHearingDateFormat;
            AddZerosToShortDateFormat();
            return _chromeHearingDateFormat;
        }

        private static void AddZerosToShortDateFormat()
        {
            var splitDate = _chromeHearingDateFormat.Split("/");
            foreach (var portion in splitDate)
            {
                if (portion.Equals("d"))
                    _chromeHearingDateFormat = _chromeHearingDateFormat.Replace("d", "dd");

                if (portion.Equals("M"))
                    _chromeHearingDateFormat = _chromeHearingDateFormat.Replace("M", "MM");
            }
        }
    }
}
