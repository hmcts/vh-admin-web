using AdminWebsite.Security;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace AdminWebsite.Helper
{
    public class AdministratorRoleClaimsHelper
    {
        private const string VhOfficerAdministratorClaimName = "IsVhOfficerAdministratorRole";
        private const string CaseAdministratorClaimName = "IsCaseAdministratorRole";
        private const string AdministratorClaimName = "IsAdministratorRole";
        private const string GroupsClaimName = "groups";

        private readonly IEnumerable<Claim> _administratorClaims;

        public AdministratorRoleClaimsHelper(string userRole)
        {
            IsVhOfficerAdministratorRole = userRole == UserRole.VhOfficer.ToString();
            IsCaseAdministratorRole = userRole == UserRole.CaseAdmin.ToString();
            IsAdministratorRole = IsVhOfficerAdministratorRole || IsCaseAdministratorRole;

            _administratorClaims = new List<Claim>
            {
                new Claim(VhOfficerAdministratorClaimName, IsVhOfficerAdministratorRole.ToString()),
                new Claim(CaseAdministratorClaimName, IsCaseAdministratorRole.ToString()),
                new Claim(AdministratorClaimName, (IsVhOfficerAdministratorRole || IsCaseAdministratorRole).ToString())
            };
        }

        public AdministratorRoleClaimsHelper(IEnumerable<Claim> claims)
        {
            var claimsList = claims.ToList();
            var vhAdminRoleClaim = claimsList.FirstOrDefault(x => x.Type == VhOfficerAdministratorClaimName);
            var caseAdminRoleClaim = claimsList.FirstOrDefault(x => x.Type == CaseAdministratorClaimName);
            var adminRoleClaim = claimsList.FirstOrDefault(x => x.Type == AdministratorClaimName);

            IsVhOfficerAdministratorRole = GetClaimValue(vhAdminRoleClaim);
            IsCaseAdministratorRole = GetClaimValue(caseAdminRoleClaim);
            IsAdministratorRole = GetClaimValue(adminRoleClaim);
        }

        public bool IsVhOfficerAdministratorRole { get; set; }
        public bool IsCaseAdministratorRole { get; set; }
        public bool IsAdministratorRole { get; set; }

        public IEnumerable<Claim> GetAdministratorClaims()
        {
            return _administratorClaims;
        }

        private static bool GetClaimValue(Claim claim)
        {
            return !string.IsNullOrWhiteSpace(claim?.Value) &&
                   (bool.TryParse(claim.Value, out var result) && result);
        }
    }
}