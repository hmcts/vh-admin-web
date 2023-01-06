﻿using System;
using System.Collections.Generic;

namespace AdminWebsite.Helper
{
    public static class DateListMapper
    {
        public static List<DateTime> GetListOfWorkingDates(DateTime startDate, DateTime endDate)
        {
            var dates = new List<DateTime>();
            var nextDate = startDate.AddDays(1);

            for (var dt = nextDate; dt.Date <= endDate.Date; dt = dt.AddDays(1))
            {
                if (!IsWeekend(dt))
                {
                    dates.Add(dt);
                }
            }

            return dates;
        }

        public static List<DateTime> GetListOfDates(DateTime startDate, DateTime endDate)
        {
            var dates = new List<DateTime>();
            var nextDate = startDate.AddDays(1);

            for (var dt = nextDate; dt.Date <= endDate.Date; dt = dt.AddDays(1))
            {
                dates.Add(dt);
            }

            return dates;
        }

        public static bool IsWeekend(DateTime date)
        {
            return date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday;
        }
    }
}
