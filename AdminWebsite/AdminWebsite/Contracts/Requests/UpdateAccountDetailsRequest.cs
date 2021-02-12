namespace AdminWebsite.Contracts.Requests
{
    public class UpdateAccountDetailsRequest
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string CurrentUsername { get; set; }
    }
}