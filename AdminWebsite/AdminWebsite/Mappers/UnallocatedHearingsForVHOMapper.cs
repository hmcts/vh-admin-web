using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.Responses;

namespace AdminWebsite.Mappers;

public static class UnallocatedHearingsForVhoMapper
{
    private static readonly Calendar Calendar = DateTimeFormatInfo.CurrentInfo.Calendar;
    public static UnallocatedHearingsForVhoResponse MapFrom(List<HearingDetailsResponse> unallocatedHearings, DateTime today)
    {
        return new UnallocatedHearingsForVhoResponse
        {
            Today = unallocatedHearings.Count(e => e.ScheduledDateTime.Date == today),
            Tomorrow = unallocatedHearings.Count(e => e.ScheduledDateTime.Date == today.AddDays(1)),
            ThisWeek = unallocatedHearings.Count(e => GetWeekOfYear(e.ScheduledDateTime.Date) == GetWeekOfYear(today)),
            ThisMonth = unallocatedHearings.Count(e 
                => e.ScheduledDateTime.Month == DateTime.Today.Month 
                && e.ScheduledDateTime.Year == DateTime.Today.Year)
        };
    }
    private static int GetWeekOfYear(DateTime date) => Calendar.GetWeekOfYear(date, CalendarWeekRule.FirstFullWeek, DayOfWeek.Monday);
    
}