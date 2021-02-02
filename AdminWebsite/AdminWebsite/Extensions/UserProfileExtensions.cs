
using AdminWebsite.Security;
using UserApi.Contract.Responses;
using System;

namespace AdminWebsite.Extensions
{
    public static class UserProfileExtensions
    {
        public static bool HasValidUserRole(this UserProfile user)
        {
            if (string.IsNullOrWhiteSpace(user.UserRole) || !Enum.TryParse<UserRoleType>(user.UserRole, out var role) || role == UserRoleType.None)
            {
                return false;
            }

            return true;
        }
    }
}
