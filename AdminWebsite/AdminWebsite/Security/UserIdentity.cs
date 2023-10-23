using AdminWebsite.Helper;
using System.Collections.Generic;
using System.Security.Claims;
using AdminWebsite.Models;

namespace AdminWebsite.Security
{
    public interface IUserIdentity
    {
        IEnumerable<string> GetGroupDisplayNames();
        
        /// <summary>
        /// Does a user have a CSO role (aka VHO but not a team lead)
        /// </summary>
        /// <returns></returns>
        bool IsACso();
        
        /// <summary>
        /// Does a user have a Team Lead role
        /// </summary>
        /// <returns></returns>
        bool IsATeamLead();
        
        string GetUserIdentityName();
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
        
        public bool IsACso()
        {
            return _currentUser.IsInRole(AppRoles.VhOfficerRole);
        }

        public bool IsATeamLead()
        {
            return _currentUser.IsInRole(AppRoles.AdministratorRole);
        }

        public string GetUserIdentityName()
        {
            return _currentUser.Identity.Name;
        }
    }
}
