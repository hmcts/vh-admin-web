using System;
using System.Collections.Generic;

namespace AdminWebsite.Models
{
    public class SearchHearingRequest
    {
        /// <summary>
        /// The hearing case types
        /// </summary>
        public List<int> Types { get; set; }

        /// <summary>
        /// Cursor specifying from which entries to read next page, is defaulted if not specified
        /// </summary>
        public string Cursor { get; set; } = "0";

        /// <summary>
        /// The max number hearings records to return.
        /// </summary>
        public int Limit { get; set; } = 100;

        /// <summary>
        /// The date of which to return hearings on or after. Defaults to UTC Now at Midnight.
        /// </summary>
        public DateTime? FromDate { get; set; } = null;

        /// <summary>
        /// Filter - Case Number
        /// </summary>
        public string CaseNumber { get; set; } = "";

        /// <summary>
        /// Filter - Venue Ids
        /// </summary>
        public List<int> VenueIds { get; set; } = null;

        /// <summary>
        /// Filter - End Date
        /// </summary>
        public DateTime? EndDate { get; set; } = null;

        /// <summary>
        /// Filter - Paticipant's last name
        /// </summary>
        public string LastName { get; set; } = "";
    }
}
