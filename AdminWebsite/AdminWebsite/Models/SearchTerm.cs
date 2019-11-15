namespace AdminWebsite.Models
{
    public class SearchTerm
    {
        public SearchTerm(string term) {
            Term = term;
        }

        public string Term { get; set; }
    }
}
