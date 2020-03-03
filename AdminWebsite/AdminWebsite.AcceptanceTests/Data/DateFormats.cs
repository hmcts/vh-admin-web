using System.Globalization;
using System.Runtime.Serialization;

namespace AdminWebsite.AcceptanceTests.Data
{
    public static class DateFormats
    {
        public static string LocalDateFormat(bool runningOnSaucelabs)
        {
            return runningOnSaucelabs ? new CultureInfo("es-ES").DateTimeFormat.ShortDatePattern : CultureInfo.CurrentUICulture.DateTimeFormat.ShortDatePattern;
        }
        public static string HearingSummaryDate = "dddd dd MMMM yyyy, h:mmtt";
    }
}
