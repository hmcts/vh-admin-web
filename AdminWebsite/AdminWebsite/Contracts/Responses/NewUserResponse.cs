namespace AdminWebsite.Contracts.Responses
{
    public class NewUserResponse
    {
        public string UserId { get; set; }
        public string Username { get; set; }
        public string OneTimePassword { get; set; }
    }
}
