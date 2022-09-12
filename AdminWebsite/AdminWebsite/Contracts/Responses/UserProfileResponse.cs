namespace AdminWebsite.Contracts.Responses
{
    public class UserProfileResponse
    {
        public bool IsVhOfficerAdministratorRole { get; set; }
        public bool IsVhTeamLeader { get; set; }
        public bool IsCaseAdministrator { get; set; }
    }
}
