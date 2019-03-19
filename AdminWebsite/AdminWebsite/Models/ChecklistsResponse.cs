using System.Collections.Generic;

namespace AdminWebsite.Models
{
    /// <summary>
    /// List of checklist responses
    /// </summary>
    public class ChecklistsResponse
    {
        /// <summary>
        /// The checklists
        /// </summary>
        public List<HearingParticipantCheckListResponse> Checklists { get; set; }
        
        /// <summary>
        /// Hearing details for the hearings the checklists refer to
        /// </summary>
        public List<ChecklistsHearingResponse> Hearings { get; set; }
        
        /// <summary>
        /// Total count of checklists in the system
        /// </summary>
        public int? Total_count { get; set; }
        
        /// <summary>
        /// The size of checklists requested for this page
        /// </summary>
        public int? Page_size { get; set; }
        
        /// <summary>
        /// The total number of pages
        /// </summary>
        public int? Total_pages { get; set; }
        
        /// <summary>
        /// The number of this given page, starting form one
        /// </summary>
        public int? Current_page { get; set; }
        
        /// <summary>
        /// An absolute url to the previous page, or null if first page
        /// </summary>
        public string Prev_page_url { get; set; }
        
        /// <summary>
        /// An absolute url to the next page, or null if last page
        /// </summary>
        public string Next_page_url { get; set; }
    }
}
