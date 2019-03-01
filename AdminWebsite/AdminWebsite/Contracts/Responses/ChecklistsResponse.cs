using System.Collections.Generic;

namespace AdminWebsite.Contracts.Responses
{
    public partial class ChecklistsResponse
    {
        public List<HearingParticipantCheckListResponse> Checklists { get; set; }
        public List<ChecklistsHearingResponse> Hearings { get; set; }
        public int? Total_count { get; set; }
        public int? Page_size { get; set; }
        public int? Total_pages { get; set; }
        public int? Current_page { get; set; }
        public string Prev_page_url { get; set; }
        public string Next_page_url { get; set; }
    }
}
