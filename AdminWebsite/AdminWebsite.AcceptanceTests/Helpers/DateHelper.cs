using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Services.Models;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public class DateHelper
    {
        public static DateTime GetNextIfDayIfNotAWorkingDay(DateTime date, List<PublicHoliday> publicHolidays)
        {
            while (IsPublicHolidayOrWeekend(date, publicHolidays))
            {
                date = date.AddDays(1);
            }

            return date;
        }
        
        public static DateTime GetNextWorkingDay(DateTime date, List<PublicHoliday> publicHolidays, int minDays)
        {
            var days = 0;
            while (days < minDays)
            {
                days++;
                date = date.AddDays(1);
                date = GetNextIfDayIfNotAWorkingDay(date, publicHolidays);
            }

            return date;
        }
        
        private static bool IsPublicHolidayOrWeekend(DateTime date,  List<PublicHoliday> publicHolidays)
        {
            var isPublicHoliday = publicHolidays.Any(x => x.Date.Date == date.Date);
            if (isPublicHoliday)
            {
                return true;
            }

            return date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday;
        }
    }
}