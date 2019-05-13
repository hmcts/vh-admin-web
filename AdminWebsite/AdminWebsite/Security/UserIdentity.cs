using AdminWebsite.Helper;
using AdminWebsite.Services;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace AdminWebsite.Security
{
    /// <summary>
    /// Active directory information for current user
    /// </summary>
    public interface IUserIdentity
    {
        IEnumerable<string> GetGroupDisplayNames();

        bool IsAdministratorRole();

        string GetUserIdentityName();

        bool IsVhOfficerAdministratorRole();

        bool IsCaseAdministratorRole();

        /// <summary>
        /// Returns a list of the case types the user is allowed to administrate
        /// </summary>
        IEnumerable<string> GetAdministratorCaseTypes();
    }

    public class UserIdentity : IUserIdentity
    {
        private static readonly string[] AcceptedAdministratorRoles = { "Civil Money Claims", "Financial Remedy" };
        private readonly AdministratorRoleClaimsHelper _administratorRoleClaimsHelper;
        private readonly ClaimsPrincipal _currentUser;
        private readonly IUserAccountService _userAccountService;

        public UserIdentity(ClaimsPrincipal currentUser, IUserAccountService userAccountService)
        {
            _currentUser = currentUser;
            _userAccountService = userAccountService;
            _administratorRoleClaimsHelper = new AdministratorRoleClaimsHelper(_currentUser.Claims);
        }

        public IEnumerable<string> GetGroupDisplayNames()
        {
            var groupClaims = _currentUser.Claims.Where(x => x.Type == "groups").ToList();
            return groupClaims.Select(x => _userAccountService.GetGroupById(x.Value).DisplayName).ToList();
        }

        /// <inheritdoc />
        public IEnumerable<string> GetAdministratorCaseTypes()
        {
            return GetGroupDisplayNames().Where(group => AcceptedAdministratorRoles.Contains(group));
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
