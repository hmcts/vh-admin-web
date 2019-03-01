namespace AdminWebsite.Models
{
    public partial class QuestionAnswerResponse
    {
        public string Question_key { get; set; }
        public string Answer { get; set; }
        public string Notes { get; set; }
        public System.DateTime? Created_at { get; set; }
    }
}