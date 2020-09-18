using AdminWebsite.Helper;
using System.Collections.Generic;
using System.Security.Claims;
using AdminWebsite.Models;

namespace AdminWebsite.Security
{
    public interface IUserIdentity
    {
        IEnumerable<string> GetGroupDisplayNames();
        bool IsAdministratorRole();
        string GetUserIdentityName();
        bool IsVhOfficerAdministratorRole();
        bool IsCaseAdministratorRole();
        IEnumerable<string> GetAdministratorCaseTypes();
    }

    public class UserIdentity : IUserIdentity
    {
        private readonly ClaimsPrincipal _currentUser;
        private readonly AdministratorRoleClaims _administratorRoleClaims;

        public UserIdentity(ClaimsPrincipal currentUser)
        {
            _currentUser = currentUser;
            _administratorRoleClaims = new AdministratorRoleClaims(_currentUser.Claims);
        }

        public IEnumerable<string> GetGroupDisplayNames()
        {
            return _administratorRoleClaims.UserCaseTypes;
        }

        /// <inheritdoc />
        public IEnumerable<string> GetAdministratorCaseTypes()
        {
            return _administratorRoleClaims.UserCaseTypes;
        }

        public bool IsAdministratorRole()
        {
            return IsVhOfficerAdministratorRole() || IsCaseAdministratorRole();
        }

        public bool IsVhOfficerAdministratorRole()
        {
            return _currentUser.IsInRole(AppRoles.VhOfficerRole);
        }

        public bool IsCaseAdministratorRole()
        {
            return _currentUser.IsInRole(AppRoles.CaseAdminRole);
        }

        public string GetUserIdentityName()
        {
            return _currentUser.Identity.Name;
        }
    }
}
