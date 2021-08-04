using System.Globalization;

namespace AdminWebsite.AcceptanceTests.Data
{
    public static class DateFormats
    {
        public static string LocalDateFormat(bool runningOnSaucelabs)
        {
            if (runningOnSaucelabs) return new CultureInfo("en-GB").DateTimeFormat.ShortDatePattern;
            return CultureInfo.CurrentCulture.Name.ToLower().Equals("en-us") || CultureInfo.CurrentCulture.TwoLetterISOLanguageName.ToLower().Equals("iv")
                ? new CultureInfo("en-GB").DateTimeFormat.ShortDatePattern
                : CultureInfo.CurrentUICulture.DateTimeFormat.ShortDatePattern;
        }

        public static string HearingSummaryDate = "dddd dd MMMM yyyy, h:mmtt";
        public static string AudioScheduledDate = "dd MMMM yyyy";
        public static string HearingSummaryDateMultiDays = "dddd dd MMMM yyyy";
        public static string HearingSummaryTimeMultiDays = "h:mmtt";

    }
}
