using System;
using System.Collections.Generic;

namespace AdminWebsite.Contracts.Responses
{
    /// <summary>
    /// Entry in a list of bookings retrieved by date
    /// </summary>
    public class BookingsByDateResponse
    {
        public DateTime? Scheduled_date { get; set; }
        public List<BookingsHearingResponse> Hearings { get; set; }
    }
}