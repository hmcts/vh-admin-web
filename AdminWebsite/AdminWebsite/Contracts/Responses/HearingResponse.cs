using AdminWebsite.Services;
using System;
using System.Collections.Generic;

namespace AdminWebsite.Contracts.Responses
{
    public partial class HearingResponse
    {
        public List<CaseResponse> Cases { get; set; }
        public DateTime? Scheduled_date_time { get; set; }
        public int? Scheduled_duration { get; set; }
        public string Hearing_type { get; set; }
        public string Hearing_medium { get; set; }
        public string Status { get; set; }
        public long? Id { get; set; }
        public string Meeting_url { get; set; }
        public string Joining_url { get; set; }
        public DateTime? Meeting_url_expiry_time { get; set; }
        public List<ParticipantResponse> Participants { get; set; }
        public HearingVenueResponse Court { get; set; }
        public string Created_by { get; set; }
        public DateTime? Created_date { get; set; }
        public string Updated_by { get; set; }
        public DateTime? Updated_date { get; set; }
    }
}
