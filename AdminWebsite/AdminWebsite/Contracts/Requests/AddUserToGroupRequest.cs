namespace AdminWebsite.Contracts.Requests
{
    public class AddUserToGroupRequest
    {
        public string UserId { get; set; }
        public string GroupName { get; set; }
    }
    
    public class UpdateUserRecoveryInformationRequest
    {
        public string UserId { get; set; }
        public string GroupName { get; set; }
    }
}
