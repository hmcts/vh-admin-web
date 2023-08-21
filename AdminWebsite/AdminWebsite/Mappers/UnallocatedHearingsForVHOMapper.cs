using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Extensions;
using BookingsApi.Contract.V1.Responses;

namespace AdminWebsite.Mappers;

public static class UnallocatedHearingsForVhoMapper
{
    public static UnallocatedHearingsForVhoResponse MapFrom(List<HearingDetailsResponse> unallocatedHearings, DateTime today)
    {
        return new UnallocatedHearingsForVhoResponse
        {
            Today = MapToday(unallocatedHearings, today),
            Tomorrow = MapTomorrow(unallocatedHearings, today),
            Next7Days = FindNext7Days(unallocatedHearings, today),
            Next30Days = FindNext30Days(unallocatedHearings, today)
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
    
    private static DateForUnallocatedHearings FindNext7Days(List<HearingDetailsResponse> unallocatedHearings, DateTime today)
    {
        var dateStart = today.Date;
        var dateEnd = dateStart.AddDays(7);
        
        return new DateForUnallocatedHearings
        {
            Count = unallocatedHearings.Count(e => e.ScheduledDateTime.Date >= dateStart && e.ScheduledDateTime.Date <= dateEnd),
            DateStart = dateStart,
            DateEnd = dateEnd
        };
    }
    
    private static DateForUnallocatedHearings FindNext30Days(List<HearingDetailsResponse> unallocatedHearings, DateTime today)
    {
        var dateStart = today.Date;
        var dateEnd = dateStart.AddDays(30);
        
        return new DateForUnallocatedHearings
        {
            Count = unallocatedHearings.Count(e => e.ScheduledDateTime.Date >= dateStart && e.ScheduledDateTime.Date <= dateEnd),
            DateStart = dateStart,
            DateEnd = dateEnd
        };
    }
}