using System.Globalization;

namespace AdminWebsite.AcceptanceTests.Data
{
    public static class DateFormats
    {
        public static string UkDateFormat = new CultureInfo("en-GB").DateTimeFormat.ShortDatePattern;
        public static string HearingSummaryDate = "dddd dd MMMM yyyy, h:mmtt";
    }
}
