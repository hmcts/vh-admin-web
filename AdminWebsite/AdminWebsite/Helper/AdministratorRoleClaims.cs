using AdminWebsite.Services.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace AdminWebsite.Helper
{
    public class AdministratorRoleClaims
    {
        private const string UserCaseTypesClaimName = "UserCaseTypes";

        public AdministratorRoleClaims(UserRole userRole)
        {
            var caseTypes = (userRole.CaseTypes ?? Enumerable.Empty<string>()).ToList();
            var userRoleCaseTypes = string.Join(",", caseTypes);

            UserCaseTypes = caseTypes;

            Claims = new List<Claim>
            {
                new Claim(UserCaseTypesClaimName, userRoleCaseTypes)
            };
        }

        public AdministratorRoleClaims(IEnumerable<Claim> claims)
        {
            var claimsList = claims.ToList();
            var userCaseTypes = claimsList.FirstOrDefault(x => x.Type == UserCaseTypesClaimName);
            
            UserCaseTypes = userCaseTypes?.Value.Split(",".ToCharArray(), StringSplitOptions.RemoveEmptyEntries)
                            ??
                            Enumerable.Empty<string>();
            Claims = claimsList;
        }

        public IEnumerable<string> UserCaseTypes { get; }
        public IEnumerable<Claim> Claims { get; }
    }
}