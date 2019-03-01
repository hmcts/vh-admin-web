namespace AdminWebsite.Contracts.Responses
{
    public partial class HearingParticipantCheckListResponse
    {
        public long? Hearing_id { get; set; }
        public long? Participant_id { get; set; }
        public string Title { get; set; }
        public string First_name { get; set; }
        public string Last_name { get; set; }
        public string Role { get; set; }
        public System.DateTime? Completed_date { get; set; }
        public System.Collections.Generic.List<QuestionAnswerResponse> Question_answer_responses { get; set; }
        public string Landline { get; set; }
        public string Mobile { get; set; }
    }
}