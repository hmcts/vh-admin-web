using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Services.Models;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public class DateHelper
    {
        public static DateTime GetNextIfNotAWorkingDay(DateTime date, List<PublicHoliday> publicHolidays)
        {
            while (IsPublicHolidayOrWeekend(date, publicHolidays))
            {
                date = date.AddDays(1);
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