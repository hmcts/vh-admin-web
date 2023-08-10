using System;
using System.Collections.Generic;

namespace AdminWebsite.Contracts.Responses;

public class BookingsListResponse
{
    public string NextCursor { get; set; }
    public int Limit { get; set; }
    public string PrevPageUrl { get; set; }
    public string NextPageUrl { get; set; }
    public List<BookingsByDateResponse> Hearings { get; set; }
}
public class BookingsByDateResponse
{
    public DateTime ScheduledDate { get; set; }
    public List<HearingResponse> Hearings { get; set; }
}