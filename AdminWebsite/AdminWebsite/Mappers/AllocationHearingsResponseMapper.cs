using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.Responses;

namespace AdminWebsite.Mappers;

public static class AllocationHearingsResponseMapper
{
    public static AllocationHearingsResponse Map(HearingAllocationsResponse hearing)
    {
        return new AllocationHearingsResponse
        {
            HearingId = hearing.HearingId,
            ScheduledDateTime = hearing.ScheduledDateTime,
            Duration = hearing.Duration,
            CaseNumber = hearing.CaseNumber,
            CaseType = hearing.CaseType,
            AllocatedCso = hearing.AllocatedCso,
            HasWorkHoursClash = hearing.HasWorkHoursClash,
            ConcurrentHearingsCount = hearing.ConcurrentHearingsCount
        };
    }
}