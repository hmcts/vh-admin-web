using System;
using System.Collections.Generic;

namespace AdminWebsite.Helper
{
    public static class DateListMapper
    {
        public static List<DateTime> GetListOfWorkingDates(string startDate, string endDate)
        {
            try
            {
                var start = DateTime.Parse(startDate);
                var end = DateTime.Parse(endDate);
                return GetListOfWorkingDates(start, end);
            }
            catch (Exception)
            {
                return new List<DateTime>();
            }
        }

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

        public static bool IsWeekend(DateTime date)
        {
            return date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday;
        }
    }
}
