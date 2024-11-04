using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AdminWebsite.Models
{
    public class MultiHearingRequest
    {
        [JsonRequired]
        public DateTime StartDate { get; set; }
        
        [JsonRequired]
        public DateTime EndDate { get; set; }
        
        public IList<DateTime> HearingDates { get; set; }

        [JsonRequired]
        public bool IsIndividualDates { get; set; }
        
        [JsonRequired]
        public int ScheduledDuration { get; set; }
    }
}
