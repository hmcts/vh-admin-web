namespace AdminWebsite.Models
{
    /// <summary>
    /// A list of checklist answers for a given participant
    /// </summary>
    public class HearingParticipantCheckListResponse
    {
        /// <summary>
        /// Id of the hearing the checklist was answered for
        /// </summary>
        public long? Hearing_id { get; set; }

        /// <summary>
        /// The unique participant id
        /// </summary>
        public long? Participant_id { get; set; }

        /// <summary>
        /// Participant title
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// The participants first name
        /// </summary>
        public string First_name { get; set; }

        /// <summary>
        /// The participants last name
        /// </summary>
        public string Last_name { get; set; }

        /// <summary>
        /// The participants role in the system
        /// </summary>
        public string Role { get; set; }

        /// <summary>
        /// The date and time the checklist was submitted
        /// </summary>
        public System.DateTime? Completed_date { get; set; }

        /// <summary>
        /// A list of checklist responses
        /// </summary>
        public System.Collections.Generic.List<QuestionAnswerResponse> Question_answer_responses { get; set; }

        /// <summary>
        /// The participant land line number
        /// </summary>
        public string Landline { get; set; }

        /// <summary>
        /// The participants mobile telephone number
        /// </summary>
        public string Mobile { get; set; }
    }
}