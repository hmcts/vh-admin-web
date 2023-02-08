using System;

namespace AdminWebsite.Contracts.Responses;

public class AllocationHearingsResponse
{
    /// <summary>
    /// The hearing id
    /// </summary>
    public Guid HearingId { get; set; }
    
    /// <summary>
    /// The date of the hearing
    /// </summary>
    public DateTime HearingDate { get; set; }
    
    /// <summary>
    /// The start time for a hearing
    /// </summary>
    public TimeSpan StartTime { get; set; }
    
    /// <summary>
    /// The duration of a hearing in minutes
    /// </summary>
    public int Duration { get; set; }
    
    /// <summary>
    /// The hearing case number
    /// </summary>
    public string CaseNumber { get; set; }
    
    /// <summary>
    /// The hearing case type
    /// </summary>
    public string CaseType { get; set; }
    
    /// <summary>
    /// The allocated CSO. Can be one of following:
    /// <list type="bullet">
    ///     <item>"Not Allocated"</item>
    ///     <item>"Not Required" (if venue is scottish or case type is generic)</item>
    ///     <item>The username of the allocated justice user</item>
    /// </list>
    /// </summary>
    public string AllocatedCso { get; set; }
    
    /// <summary>
    /// True if the hearing is outside of the CSO's work hours. Null if the hearing has no allocated cso
    /// </summary>
    public bool? HasWorkHoursClash { get; set; }
}