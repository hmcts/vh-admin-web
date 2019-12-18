namespace AdminWebsite.Models
{
    /// <summary>
    /// A single checklist question response
    /// </summary>
    public class QuestionAnswerResponse
    {
        /// <summary>
        /// The unique key for the question answered
        /// </summary>
        public string Question_key { get; set; }

        /// <summary>
        /// The answer
        /// </summary>
        public string Answer { get; set; }

        /// <summary>
        /// Any additional text given to the answer
        /// </summary>
        public string Notes { get; set; }

        /// <summary>
        /// The date and time this specific question was answered
        /// </summary>
        public System.DateTime? Created_at { get; set; }
    }
}