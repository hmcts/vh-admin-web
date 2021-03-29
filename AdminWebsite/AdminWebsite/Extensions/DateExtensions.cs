using System;
using System.Globalization;
using TimeZoneConverter;

namespace AdminWebsite.Extensions
{
    public static class DateExtensions
    {
        private static readonly TimeZoneInfo BritishZone = TZConvert.GetTimeZoneInfo("Europe/London");
        public static string ToEmailDateGbLocale(this DateTime datetime)
        {
            return TimeZoneInfo.ConvertTimeFromUtc(datetime, BritishZone).ToString("d MMMM yyyy", new CultureInfo("en-GB"));
        }
        
        public static string ToEmailTimeGbLocale(this DateTime datetime)
        {
            return TimeZoneInfo.ConvertTimeFromUtc(datetime, BritishZone).ToString("h:mm tt", new CultureInfo("en-GB"))
                .ToUpper();
        }
    }
}