using System;
using System.Collections.Generic;

namespace AdminWebsite.Models
{
    public class MultiHearingRequest
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        
        public IList<DateTime> HearingDates { get; set; }

        public bool IsIndividualDates { get; set; }
    }
}
