using AdminWebsite.Models;
using BookingsApi.Contract.Requests;

namespace AdminWebsite.Contracts.Requests
{
    public class BookHearingRequest
    {
        public BookNewHearingRequest BookingDetails { get; set; }
        public bool IsMultiDay { get; set; }
        public MultiHearingRequest MultiHearingDetails { get; set; }
        public string OtherInformationDetails { get; set; }
    }
}