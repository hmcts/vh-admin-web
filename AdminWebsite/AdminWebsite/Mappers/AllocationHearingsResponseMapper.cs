using System.Linq;
using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.Responses;

namespace AdminWebsite.Mappers;

public static class AllocationHearingsResponseMapper
{
    public static AllocationHearingsResponse Map(HearingDetailsResponse hearing)
    {
        return new AllocationHearingsResponse
        {
            HearingId = hearing.Id,
            HearingDate = hearing.ScheduledDateTime.Date,
            StartTime = hearing.ScheduledDateTime.TimeOfDay,
            Duration = hearing.ScheduledDuration,
            CaseNumber = hearing.Cases.FirstOrDefault()?.Number,
            CaseType = hearing.CaseTypeName,
            AllocatedCso = hearing.AllocatedTo
        };
    }
}