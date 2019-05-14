using AdminWebsite.Helper;
using System.Collections.Generic;
using System.Linq;
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
        private static readonly string[] AcceptedAdministratorRoles = { "Civil Money Claims", "Financial Remedy" };
        private readonly ClaimsPrincipal _currentUser;
        private readonly AdministratorRoleClaimsHelper _administratorRoleClaimsHelper;

        public UserIdentity(ClaimsPrincipal currentUser)
        {
            _currentUser = currentUser;
            _administratorRoleClaimsHelper = new AdministratorRoleClaimsHelper(_currentUser.Claims);
        }

        public IEnumerable<string> GetGroupDisplayNames()
        {
            return _administratorRoleClaimsHelper.UserCaseTypes;
        }

        /// <inheritdoc />
        public IEnumerable<string> GetAdministratorCaseTypes()
        {
            return _administratorRoleClaimsHelper.UserCaseTypes.Where(group => AcceptedAdministratorRoles.Contains(group));
        }

        public bool IsAdministratorRole()
        {
            return _administratorRoleClaimsHelper.IsAdministratorRole;
        }

        public bool IsVhOfficerAdministratorRole()
        {
            return _administratorRoleClaimsHelper.IsVhOfficerAdministratorRole;
        }

        public bool IsCaseAdministratorRole()
        {
            return _administratorRoleClaimsHelper.IsCaseAdministratorRole;
        }

        public string GetUserIdentityName()
        {
            return _currentUser.Identity.Name;
        }
    }
}
