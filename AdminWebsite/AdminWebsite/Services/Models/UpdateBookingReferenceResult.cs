using AdminWebsite.VideoAPI.Client;

namespace AdminWebsite.Services.Models
{
    public class UpdateBookingReferenceResult
    {
        public ConferenceDetailsResponse UpdateResponse { get; set; }
        public bool Successful { get; set; }
    }
}
