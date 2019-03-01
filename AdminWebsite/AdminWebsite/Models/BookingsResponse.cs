using System.Collections.Generic;

namespace AdminWebsite.Models
{
    public partial class BookingsResponse
    {
        public List<BookingsByDateResponse> Hearings { get; set; }
        public string Next_cursor { get; set; }
        public int? Limit { get; set; }
        public string Prev_page_url { get; set; }
        public string Next_page_url { get; set; }
    }
}
