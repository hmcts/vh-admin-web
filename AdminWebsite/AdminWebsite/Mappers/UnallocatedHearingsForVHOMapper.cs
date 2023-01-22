using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Extensions;
using BookingsApi.Contract.Responses;

namespace AdminWebsite.Mappers;

public static class UnallocatedHearingsForVhoMapper
{
    public static UnallocatedHearingsForVhoResponse MapFrom(List<HearingDetailsResponse> unallocatedHearings, DateTime today)
    {
        return new UnallocatedHearingsForVhoResponse
        {
            Today = MapToday(unallocatedHearings, today),
            Tomorrow = MapTomorrow(unallocatedHearings, today),
            ThisWeek = FindThisWeek(unallocatedHearings, today),
            ThisMonth = FindThisMonth(unallocatedHearings, today)
        };
    }

    private static DateForUnallocatedHearings MapToday(List<HearingDetailsResponse> unallocatedHearings, DateTime today)
    {
        return new DateForUnallocatedHearings
        {
            Count = unallocatedHearings.Count(e => e.ScheduledDateTime.Date == today),
            DateStart = today
        };
    }
    
    private static DateForUnallocatedHearings MapTomorrow(List<HearingDetailsResponse> unallocatedHearings, DateTime today)
    {
        var tomorrow = today.AddDays(1);
        return new DateForUnallocatedHearings
        {
            Count = unallocatedHearings.Count(e => e.ScheduledDateTime.Date == tomorrow),
            DateStart = tomorrow
        };
    }
    
    private static DateForUnallocatedHearings FindThisWeek(List<HearingDetailsResponse> unallocatedHearings, DateTime today)
    {
        var dateStart = today.Date.FirstDayOfWeek();
        var dateEnd = dateStart.AddDays(6);
        
        return new DateForUnallocatedHearings
        {
            Count = unallocatedHearings.Count(e => e.ScheduledDateTime.Date.GetWeekOfYear() == today.GetWeekOfYear()),
            DateStart = dateStart,
            DateEnd = dateEnd
        };
    }
    
    private static DateForUnallocatedHearings FindThisMonth(List<HearingDetailsResponse> unallocatedHearings, DateTime today)
    {
        var firstDayOfMonth = new DateTime(today.Year, today.Month, 1);
        var lastDayOfMonth = firstDayOfMonth.AddMonths(1).AddSeconds(-1).Date;
        
        return new DateForUnallocatedHearings
        {
            Count = unallocatedHearings.Count(e => e.ScheduledDateTime.Month == DateTime.Today.Month && e.ScheduledDateTime.Year == DateTime.Today.Year),
            DateStart = firstDayOfMonth,
            DateEnd = lastDayOfMonth
        };
    }
}