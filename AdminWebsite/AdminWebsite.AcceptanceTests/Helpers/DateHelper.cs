using System;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public class DateHelper
    {
        public static DateTime GetNextIfDayIfNotAWorkingDay(DateTime date)
        {
            while (IsWeekend(date))
            {
                date = date.AddDays(1);
            }

            return date;
        }
        
        public static DateTime GetNextWorkingDay(DateTime date, int minDays)
        {
            var days = 0;
            while (days < minDays)
            {
                days++;
                date = date.AddDays(1);
                date = GetNextIfDayIfNotAWorkingDay(date);
            }

            return date;
        }
        
        private static bool IsWeekend(DateTime date)
        {
            return date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday;
        }
    }
}