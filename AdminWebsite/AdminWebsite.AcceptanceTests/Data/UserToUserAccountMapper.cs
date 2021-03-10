using System.Collections.Generic;
using AcceptanceTests.Common.Configuration.Users;
using TestApi.Contract.Dtos;

namespace AdminWebsite.AcceptanceTests.Data
{
    public static class UserToUserAccountMapper
    {
        public static UserAccount Map(UserDto user)
        {
            return new UserAccount()
            {
                AlternativeEmail = user.ContactEmail,
                CaseRoleName = null,
                DefaultParticipant = false,
                DisplayName = user.DisplayName,
                Firstname = user.FirstName,
                HearingRoleName = null,
                HearingTypes = new List<string>(),
                Key = user.LastName,
                Lastname = user.LastName,
                Representee = null,
                Reference = null,
                Role = user.UserType.ToString(),
                Username = user.Username
            };
        }
    }
}
