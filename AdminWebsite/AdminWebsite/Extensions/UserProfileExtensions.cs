
using AdminWebsite.Security;
using AdminWebsite.UserAPI.Client;
using System;

namespace AdminWebsite.Extensions
{
    public static class UserProfileExtensions
    {
        public static bool HasValidUserRole(this UserProfile user)
        {
            if (string.IsNullOrWhiteSpace(user.User_role) || !Enum.TryParse<UserRoleType>(user.User_role, out var role) || role == UserRoleType.None)
            {
                return false;
            }

            return true;
        }
    }
}
