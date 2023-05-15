using System;

namespace AdminWebsite.Contracts.Responses;

public class UnallocatedHearingsForVhoResponse
{
    
    public DateForUnallocatedHearings Today { get; set; }
    public DateForUnallocatedHearings Tomorrow { get; set; }
    public DateForUnallocatedHearings Next7Days { get; set; }
    public DateForUnallocatedHearings Next30Days { get; set; }
}

public class DateForUnallocatedHearings
{
    public int Count { get; set; }
    public DateTime DateStart { get; set; }
    public DateTime? DateEnd { get; set; }
}