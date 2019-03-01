using System;
using System.Collections.Generic;

namespace AdminWebsite.Contracts.Responses
{
    public partial class ChecklistsHearingResponse
    {
        public long? Hearing_id { get; set; }
        public DateTime? Scheduled_date_time { get; set; }
        public string Status { get; set; }
        public List<CaseResponse> Cases { get; set; }
    }
}
