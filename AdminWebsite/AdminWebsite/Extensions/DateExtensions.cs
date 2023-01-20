using System;
using System.Globalization;
using TimeZoneConverter;

namespace AdminWebsite.Extensions
{
    public static class DateExtensions
    {
        private static readonly TimeZoneInfo BritishZone = TZConvert.GetTimeZoneInfo("Europe/London");
        private static readonly CultureInfo CultureInfo = new CultureInfo("en-GB");
        private static readonly Calendar Calendar = DateTimeFormatInfo.CurrentInfo.Calendar;
        public static string ToEmailDateGbLocale(this DateTime datetime)
        {
            var gmtDate = TimeZoneInfo.ConvertTimeFromUtc(datetime, BritishZone);
            return gmtDate.ToString("d MMMM yyyy", CultureInfo);
        }
        
        public static string ToEmailTimeGbLocale(this DateTime datetime)
        {
            var gmtDate = TimeZoneInfo.ConvertTimeFromUtc(datetime, BritishZone);
            return gmtDate.ToString("h:mm tt", CultureInfo)
                .ToUpper();
        }
        
        public static int GetWeekOfYear(this DateTime date) => Calendar.GetWeekOfYear(date, CalendarWeekRule.FirstFullWeek, DayOfWeek.Monday);
        
        public static DateTime FirstDayOfWeek(this DateTime date) => date.AddDays(-(int)date.DayOfWeek + 1); //first day of week is sunday so +1
        
    }
}