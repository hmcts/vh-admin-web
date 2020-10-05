using System.Globalization;

namespace AdminWebsite.AcceptanceTests.Data
{
    public static class DateFormats
    {
        public static string LocalDateFormat(bool runningOnSaucelabs)
        {
            return runningOnSaucelabs ? new CultureInfo("es-PR").DateTimeFormat.ShortDatePattern : CultureInfo.CurrentUICulture.DateTimeFormat.ShortDatePattern;
        }

        public static string HearingSummaryDate = "dddd dd MMMM yyyy, h:mmtt";
        public static string AudioScheduledDate = "dd MMMM yyyy";
        public static string HearingSummaryDateMultiDays = "dddd dd MMMM yyyy";
        public static string HearingSummaryTimeMultiDays = "h:mmtt";

    }
}
