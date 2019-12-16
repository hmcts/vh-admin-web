using AdminWebsite.Security;
using AdminWebsite.Services.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace AdminWebsite.Helper
{
    public class AdministratorRoleClaims
    {
        private const string VhOfficerAdministratorClaimName = "IsVhOfficerAdministratorRole";
        private const string CaseAdministratorClaimName = "IsCaseAdministratorRole";
        private const string UserCaseTypesClaimName = "UserCaseTypes";

        public AdministratorRoleClaims(UserRole userRole)
        {
            var caseTypes = (userRole.CaseTypes ?? Enumerable.Empty<string>()).ToList();
            var userRoleCaseTypes = string.Join(",", caseTypes);

            IsVhOfficerAdministratorRole = userRole.UserRoleType == UserRoleType.VhOfficer;
            IsCaseAdministratorRole = userRole.UserRoleType == UserRoleType.CaseAdmin;
            IsAdministratorRole = IsVhOfficerAdministratorRole || IsCaseAdministratorRole;
            UserCaseTypes = caseTypes;

            Claims = new List<Claim>
            {
                new Claim(VhOfficerAdministratorClaimName, IsVhOfficerAdministratorRole.ToString()),
                new Claim(CaseAdministratorClaimName, IsCaseAdministratorRole.ToString()),
                new Claim(UserCaseTypesClaimName, userRoleCaseTypes)
            };
        }

        public AdministratorRoleClaims(IEnumerable<Claim> claims)
        {
            var claimsList = claims.ToList();
            var vhAdminRoleClaim = claimsList.FirstOrDefault(x => x.Type == VhOfficerAdministratorClaimName);
            var caseAdminRoleClaim = claimsList.FirstOrDefault(x => x.Type == CaseAdministratorClaimName);
            var userCaseTypes = claimsList.FirstOrDefault(x => x.Type == UserCaseTypesClaimName);

            IsVhOfficerAdministratorRole = GetValue(vhAdminRoleClaim);
            IsCaseAdministratorRole = GetValue(caseAdminRoleClaim);
            IsAdministratorRole = IsVhOfficerAdministratorRole || IsCaseAdministratorRole;
            UserCaseTypes = userCaseTypes?.Value.Split(",".ToCharArray(), StringSplitOptions.RemoveEmptyEntries)
                            ??
                            Enumerable.Empty<string>();
            Claims = claimsList;
        }

        public bool IsVhOfficerAdministratorRole { get; set; }
        public bool IsCaseAdministratorRole { get; set; }
        public bool IsAdministratorRole { get; set; }
        public IEnumerable<string> UserCaseTypes { get; set; }
        public IEnumerable<Claim> Claims { get; }

        private static bool GetValue(Claim claim)
        {
            if (claim?.Value == null)
            {
                throw new ArgumentNullException(nameof(claim), "The claim or its value can not be null");
            }

            bool.TryParse(claim.Value, out var result);

            return result;
        }
    }
}