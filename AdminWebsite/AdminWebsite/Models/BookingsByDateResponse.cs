using System;
using System.Collections.Generic;

namespace AdminWebsite.Models
{
    public partial class BookingsByDateResponse
    {
        public DateTime? Scheduled_date { get; set; }
        public List<BookingsHearingResponse> Hearings { get; set; }
    }
}