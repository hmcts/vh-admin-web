using AdminWebsite.Helper;
using System.Collections.Generic;
using System.Security.Claims;

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
            return _administratorRoleClaims.IsAdministratorRole;
        }

        public bool IsVhOfficerAdministratorRole()
        {
            return _administratorRoleClaims.IsVhOfficerAdministratorRole;
        }

        public bool IsCaseAdministratorRole()
        {
            return _administratorRoleClaims.IsCaseAdministratorRole;
        }

        public string GetUserIdentityName()
        {
            return _currentUser.Identity.Name;
        }
    }
}
