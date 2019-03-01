using System;
using System.Collections.Generic;

namespace AdminWebsite.Models
{
    /// <summary>
    /// Hearings grouped by day
    /// </summary>
    public class BookingsByDateResponse
    {
        /// <summary>
        /// The date bookings are grouped by
        /// </summary>
        public DateTime? Scheduled_date { get; set; }
        
        /// <summary>
        /// List of hearings for the day
        /// </summary>
        public List<BookingsHearingResponse> Hearings { get; set; }
    }
}