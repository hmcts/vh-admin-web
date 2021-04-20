using System;
using BookingsApi.Contract.Requests;

namespace Testing.Common
{
    public class ApiUriFactory
    {
        public ApiUriFactory()
        {
            ConfigSettingsEndpoints = new ConfigSettingsEndpoints();
            HearingEndpoints = new HearingEndpoints();
            ReferenceEndpoints = new ReferenceEndpoints();
            UserAccountEndpoints = new UserAccountEndpoints();
            UserIdentityEndpoints = new UserIdentityEndpoints();
        }            
    
        public ConfigSettingsEndpoints ConfigSettingsEndpoints { get; set; }
        public HearingEndpoints HearingEndpoints { get; set; }
        public ReferenceEndpoints ReferenceEndpoints { get; set; }
        public UserAccountEndpoints UserAccountEndpoints { get; set; }
        public UserIdentityEndpoints UserIdentityEndpoints { get; set; }
    }

    public class ConfigSettingsEndpoints
    {
        private string ApiRoot => "api/config";
        public string GetConfigSettings => ApiRoot;
    }

    public class HearingEndpoints
    {
        private string ApiRoot => "/hearings";
        public string BookNewHearing => ApiRoot;
        public string UpdateHearingStatus(Guid hearingId, 
            UpdateBookingStatusRequest updateBookingStatusRequest) => $"{ApiRoot}/{hearingId}";
        public string RemoveHearing(string hearingId) => $"{ApiRoot}/{hearingId}";
    }

    public class ReferenceEndpoints
    {
        private string ApiRoot => "api/reference";
        public string GetHearingTypes => $"{ApiRoot}/types";
        public string GetParticipantRoles => $"{ApiRoot}/participantroles";
        public string GetCourts => $"{ApiRoot}/courts";
    }

    public class UserAccountEndpoints
    {
        private string ApiRoot => "api/accounts";

        public string CreateUser => $"{ApiRoot}/user";
        public string AddUserToGroup => $"{ApiRoot}/user/group";
        public string SetRecoveryEmail => $"{ApiRoot}/user/recovery";
        public string GetUserByAdUserId(string userId) => $"{ApiRoot}/user/{userId}";
        public string GetUserByRecoveryEmail(string recoveryEmail) => $"{ApiRoot}/user?recoveryMail={recoveryEmail}";
        public string GetGroupsForUser(string userId) => $"{ApiRoot}/user/{userId}/groups";
        public string GetGroupByName(string groupName) => $"{ApiRoot}/group/?name={groupName}";
        public string GetGroupById(string groupId) => $"{ApiRoot}/group/{groupId}";
        public string GetUsersByGroup(string groupName) => $"{ApiRoot}/judges";
    }

    public class UserIdentityEndpoints
    {
        private string ApiRoot => "api/user";
        public string GetUserProfile => ApiRoot;
    }
}
