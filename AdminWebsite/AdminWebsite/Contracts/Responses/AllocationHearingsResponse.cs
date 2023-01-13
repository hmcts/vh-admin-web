using System;

namespace AdminWebsite.Contracts.Responses;

public class AllocationHearingsResponse
{
    public Guid HearingId { get; set; }
    public DateTime HearingDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public int Duration { get; set; }
    public string CaseNumber { get; set; }
    public string CaseType { get; set; }
    public string AllocatedCso { get; set; }
}