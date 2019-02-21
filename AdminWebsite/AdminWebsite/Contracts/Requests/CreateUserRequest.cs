namespace AdminWebsite.Contracts.Requests
{
    public class CreateUserRequest
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string RecoveryEmail { get; set; }
    }
}
