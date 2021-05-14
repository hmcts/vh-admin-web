using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Services.Models;

namespace AdminWebsite.Helper
{
    public static class DateListMapper
    {
        public static List<DateTime> GetListOfWorkingDates(DateTime startDate, DateTime endDate,
            List<PublicHoliday> publicHolidays = null)
        {
            var pbDates = publicHolidays == null ? new List<DateTime>() : publicHolidays.Select(x => x.Date.Date).ToList();
            var dates = new List<DateTime>();
            var nextDate = startDate.AddDays(1);

            for (var dt = nextDate; dt.Date <= endDate.Date; dt = dt.AddDays(1))
            {
                if (!IsWeekend(dt) && !IsPublicHoliday(dt, pbDates))
                {
                    dates.Add(dt);
                }
            }

            return dates;
        }

        public static bool IsWeekend(DateTime date)
        {
            return date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday;
        }

        public static bool IsPublicHoliday(DateTime date, List<DateTime> publicHolidays)
        {
            return publicHolidays.Contains(date.Date);
        }
    }
}
