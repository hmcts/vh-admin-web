using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.Responses;

namespace AdminWebsite.Mappers;

public class UnallocatedHearingsForVHOMapper
{
    private static readonly Calendar Calendar = DateTimeFormatInfo.CurrentInfo.Calendar;

    public static UnallocatedHearingsForVHOResponse MapFrom(List<HearingDetailsResponse> unallocatedHearings)
    {
        return new UnallocatedHearingsForVHOResponse
        {
            Today = unallocatedHearings.Count(e => e.ScheduledDateTime.Date == DateTime.Today),
            Tomorrow = unallocatedHearings.Count(e => e.ScheduledDateTime.Date == DateTime.Today.AddDays(1)),
            ThisWeek = unallocatedHearings.Count(e => GetWeekOfYear(e.ScheduledDateTime.Date) == GetWeekOfYear(DateTime.Today)),
            ThisMonth = unallocatedHearings.Count(e 
                => e.ScheduledDateTime.Month == DateTime.Today.Month 
                && e.ScheduledDateTime.Year == DateTime.Today.Year)
        };
    }
    private static int GetWeekOfYear(DateTime date) => Calendar.GetWeekOfYear(date, CalendarWeekRule.FirstFullWeek, DayOfWeek.Monday);
    
}