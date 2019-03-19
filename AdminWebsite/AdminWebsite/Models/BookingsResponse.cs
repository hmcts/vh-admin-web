using System.Collections.Generic;

namespace AdminWebsite.Models
{
    /// <summary>
    /// A list of hearing bookings
    /// </summary>
    public class BookingsResponse
    {
        /// <summary>
        /// List of hearings
        /// </summary>
        public List<BookingsByDateResponse> Hearings { get; set; }
        
        /// <summary>
        /// The next cursor to continue reading the list of hearings from
        /// </summary>
        public string Next_cursor { get; set; }
        
        /// <summary>
        /// How many hearings were requested
        /// </summary>
        public int? Limit { get; set; }
        
        /// <summary>
        /// The url to the previous page of hearings (or null if not available)
        /// </summary>
        public string Prev_page_url { get; set; }
        
        /// <summary>
        /// The url to the next page of hearings (or null if not available)
        /// </summary>
        public string Next_page_url { get; set; }
    }
}
