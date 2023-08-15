using AdminWebsite.Models;

namespace AdminWebsite.Contracts.Requests
{
    public class BookHearingRequest
    {
        public BookingDetailsRequest BookingDetails { get; set; }
        public bool IsMultiDay { get; set; }
        public MultiHearingRequest MultiHearingDetails { get; set; }
        public string OtherInformationDetails { get; set; }
    }
}