namespace AdminWebsite.Contracts.Requests
{
    public class ParticipantRequest
    {
        public ParticipantRequest()
        {
        }

        public string Display_name { get; set; }
        public string Email { get; set; }
        public string First_name { get; set; }
        public string Last_name { get; set; }
        public string Phone { get; set; }
        public string Role { get; set; }
        public string Title { get; set; }
        public string Username { get; set; }
    }
}