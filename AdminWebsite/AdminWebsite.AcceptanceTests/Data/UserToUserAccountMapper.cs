using System.Collections.Generic;
using AcceptanceTests.Common.Configuration.Users;
using AdminWebsite.TestAPI.Client;

namespace AdminWebsite.AcceptanceTests.Data
{
    public static class UserToUserAccountMapper
    {
        public static UserAccount Map(User user)
        {
            return new UserAccount()
            {
                AlternativeEmail = user.Contact_email,
                CaseRoleName = null,
                DefaultParticipant = false,
                DisplayName = user.Display_name,
                Firstname = user.First_name,
                HearingRoleName = null,
                HearingTypes = new List<string>(),
                Key = user.Last_name,
                Lastname = user.Last_name,
                Representee = null,
                Reference = null,
                Role = user.User_type.ToString(),
                Username = user.Username
            };
        }
    }
}
