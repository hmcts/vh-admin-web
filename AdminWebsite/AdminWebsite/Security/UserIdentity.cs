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
    }

    public class UserIdentity : IUserIdentity
    {
        private static readonly string[] AcceptedAdministratorRoles = { "Civil Money Claims", "Tax", "Financial Remedy" };
        private static readonly string virtualRoomAdministrator = "VirtualRoomAdministrator";

        private readonly ClaimsPrincipal _currentUser;
        private readonly IUserAccountService _userAccountService;

        public UserIdentity(ClaimsPrincipal currentUser, IUserAccountService userAccountService)
        {
            _currentUser = currentUser;
            _userAccountService = userAccountService;
        }

        public IEnumerable<string> GetGroupDisplayNames()
        {
            var groupClaims = _currentUser.Claims.Where(x => x.Type == "groups").ToList();
            return groupClaims.Select(x => _userAccountService.GetGroupById(x.Value).DisplayName).ToList();            
        }

        public bool IsAdministratorRole()
        {
            var groups = GetGroupDisplayNames().ToList();
            const string internalGroup = "Internal";
            const string administratorGroup = "HearingAdministrator";

            return groups.Any(g => AcceptedAdministratorRoles.Contains(g))
                   || (groups.Contains(internalGroup) && groups.Contains(administratorGroup))
                   || groups.Contains(virtualRoomAdministrator);
        }

        public bool IsVhOfficerAdministratorRole()
        {
            var groups = GetGroupDisplayNames().ToList();
            return groups.Contains(virtualRoomAdministrator);
        }

        public bool IsCaseAdministratorRole()
        {
            var groups = GetGroupDisplayNames().ToList();
            return groups.Any(g => AcceptedAdministratorRoles.Contains(g));
        }

        public string GetUserIdentityName()
        {
            return _currentUser.Identity.Name;
        }
    }
}
