using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;

namespace AdminWebsite.Contracts.Requests
{
    public class BookHearingRequest
    {
        public BookNewHearingRequest BookingDetails { get; set; }
        public bool IsMultiDay { get; set; }
        public MultiHearingRequest MultiHearingDetails { get; set; }
    }
}