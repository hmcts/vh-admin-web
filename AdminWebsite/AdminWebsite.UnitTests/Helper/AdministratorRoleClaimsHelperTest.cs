using AdminWebsite.Helper;
using AdminWebsite.Services.Models;
using FluentAssertions;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace AdminWebsite.UnitTests.Helper
{
    public class AdministratorRoleClaimsHelperTest
    {
        [Test]
        public void GetAdministratorClaims_Returns_Claims()
        {
            var userGroupData = new UserGroupData
            {
                UserRole = "Role1",
                CaseTypes = new List<string> { "Case1", "Case2" }
            };

            var claims = new AdministratorRoleClaimsHelper(userGroupData).GetAdministratorClaims().ToList();

            claims.Should().NotBeNull();
            claims.Should().NotContainNulls();
            claims.Should().HaveCountGreaterThan(0);
            var userCaseTypesClaim = claims.FirstOrDefault(x => x.Type == "UserCaseTypes");
            userCaseTypesClaim.Should().NotBeNull();
            userCaseTypesClaim?.Value.Should().Be("Case1,Case2");
        }

        [TestCase("VhOfficer", true)]
        [TestCase("SomeRole", false)]
        public void IsVhOfficerAdministratorRole_Properties_Are_Correctly_Set(string role, bool expectedClaimValue)
        {
            var userGroupData = new UserGroupData { UserRole = role };
            var claims = new List<Claim>
            {
                new Claim("IsVhOfficerAdministratorRole", expectedClaimValue.ToString())
            };

            AdministratorRoleClaimsHelper administratorRoleClaimsHelper;

            administratorRoleClaimsHelper = new AdministratorRoleClaimsHelper(userGroupData);
            administratorRoleClaimsHelper.IsVhOfficerAdministratorRole.Should().Be(expectedClaimValue);

            administratorRoleClaimsHelper = new AdministratorRoleClaimsHelper(claims);
            administratorRoleClaimsHelper.IsVhOfficerAdministratorRole.Should().Be(expectedClaimValue);
        }

        [TestCase("CaseAdmin", true)]
        [TestCase("VhOfficer", false)]
        [TestCase("SomeRole", false)]
        public void IsCaseAdministratorRole_Properties_Are_Correctly_Set(string role, bool expectedClaimValue)
        {
            var userGroupData = new UserGroupData { UserRole = role };
            var claims = new List<Claim>
            {
                new Claim("IsCaseAdministratorRole", expectedClaimValue.ToString())
            };

            AdministratorRoleClaimsHelper administratorRoleClaimsHelper;

            administratorRoleClaimsHelper = new AdministratorRoleClaimsHelper(userGroupData);
            administratorRoleClaimsHelper.IsCaseAdministratorRole.Should().Be(expectedClaimValue);

            administratorRoleClaimsHelper = new AdministratorRoleClaimsHelper(claims);
            administratorRoleClaimsHelper.IsCaseAdministratorRole.Should().Be(expectedClaimValue);
        }

        [TestCase("CaseAdmin", true)]
        [TestCase("VhOfficer", true)]
        [TestCase("SomeRole", false)]
        public void IsAdministratorRole_Properties_Are_Correctly_Set(string role, bool expectedClaimValue)
        {
            var userGroupData = new UserGroupData { UserRole = role };
            var claims = new List<Claim>
            {
                new Claim("IsAdministratorRole", expectedClaimValue.ToString())
            };

            AdministratorRoleClaimsHelper administratorRoleClaimsHelper;

            administratorRoleClaimsHelper = new AdministratorRoleClaimsHelper(userGroupData);
            administratorRoleClaimsHelper.IsAdministratorRole.Should().Be(expectedClaimValue);

            administratorRoleClaimsHelper = new AdministratorRoleClaimsHelper(claims);
            administratorRoleClaimsHelper.IsAdministratorRole.Should().Be(expectedClaimValue);
        }
    }
}