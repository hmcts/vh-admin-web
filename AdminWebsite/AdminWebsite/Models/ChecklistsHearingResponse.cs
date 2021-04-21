using System;
using System.Collections.Generic;

namespace AdminWebsite.Models
{
    /// <summary>
    /// Checklist entry
    /// </summary>
    public class ChecklistsHearingResponse
    {
        /// <summary>
        /// Which hearing the checklist belongs to
        /// </summary>
        public long? Hearing_id { get; set; }

        /// <summary>
        /// Which date and time the hearing is booked for
        /// </summary>
        public DateTime? ScheduledDateTime { get; set; }

        /// <summary>
        /// The status of the hearing
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// A list of case details for the given hearing 
        /// </summary>
        public List<CaseResponse> Cases { get; set; }
    }
}
