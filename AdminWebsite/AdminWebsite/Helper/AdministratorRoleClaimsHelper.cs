using AdminWebsite.Security;
using AdminWebsite.Services.Models;
using System;
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
        private const string UserCaseTypesClaimName = "UserCaseTypes";

        private readonly IEnumerable<Claim> _administratorClaims;

        public AdministratorRoleClaimsHelper(UserGroupData userGroupData)
        {
            IsVhOfficerAdministratorRole = userGroupData.UserRole == UserRole.VhOfficer.ToString();
            IsCaseAdministratorRole = userGroupData.UserRole == UserRole.CaseAdmin.ToString();
            IsAdministratorRole = IsVhOfficerAdministratorRole || IsCaseAdministratorRole;

            _administratorClaims = new List<Claim>
            {
                new Claim(VhOfficerAdministratorClaimName, IsVhOfficerAdministratorRole.ToString()),
                new Claim(CaseAdministratorClaimName, IsCaseAdministratorRole.ToString()),
                new Claim(AdministratorClaimName, (IsVhOfficerAdministratorRole || IsCaseAdministratorRole).ToString()),
                new Claim(UserCaseTypesClaimName, string.Join(",", userGroupData.CaseTypes ?? Enumerable.Empty<string>()))
            };
        }

        public AdministratorRoleClaimsHelper(IEnumerable<Claim> claims)
        {
            var claimsList = claims.ToList();
            var vhAdminRoleClaim = claimsList.FirstOrDefault(x => x.Type == VhOfficerAdministratorClaimName);
            var caseAdminRoleClaim = claimsList.FirstOrDefault(x => x.Type == CaseAdministratorClaimName);
            var adminRoleClaim = claimsList.FirstOrDefault(x => x.Type == AdministratorClaimName);
            var userCaseTypes = claimsList.FirstOrDefault(x => x.Type == UserCaseTypesClaimName);

            IsVhOfficerAdministratorRole = GetClaimBoolValue(vhAdminRoleClaim);
            IsCaseAdministratorRole = GetClaimBoolValue(caseAdminRoleClaim);
            IsAdministratorRole = GetClaimBoolValue(adminRoleClaim);
            UserCaseTypes = userCaseTypes?.Value.Split(",".ToCharArray(), StringSplitOptions.RemoveEmptyEntries) ??
                            Enumerable.Empty<string>();
        }

        public bool IsVhOfficerAdministratorRole { get; set; }
        public bool IsCaseAdministratorRole { get; set; }
        public bool IsAdministratorRole { get; set; }
        public IEnumerable<string> UserCaseTypes { get; set; }

        public IEnumerable<Claim> GetClaims()
        {
            return _administratorClaims;
        }

        private static bool GetClaimBoolValue(Claim claim)
        {
            return !string.IsNullOrWhiteSpace(claim?.Value) &&
                   (bool.TryParse(claim.Value, out var result) && result);
        }
    }
}