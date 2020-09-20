using AdminWebsite.Helper;
using AdminWebsite.Security;
using AdminWebsite.Services.Models;
using FluentAssertions;
using NUnit.Framework;
using System.Collections.Generic;

namespace AdminWebsite.UnitTests.Helper
{
    public class AdministratorRoleClaimsTest
    {
        [Test]
        public void Should_return_user_case_types()
        {
            var userRole = new UserRole
            {
                UserRoleType = UserRoleType.VhOfficer,
                CaseTypes = new List<string> { "Case1", "Case2" }
            };

            var created = new AdministratorRoleClaims(userRole);
            created.Should().NotBeNull();
            created.UserCaseTypes.Should().NotContainNulls();
            created.UserCaseTypes.Should().HaveCountGreaterThan(0);
            created.UserCaseTypes.Should().BeEquivalentTo(userRole.CaseTypes);

            var parsed = new AdministratorRoleClaims(created.Claims);
            parsed.Should().NotBeNull();
            parsed.UserCaseTypes.Should().NotContainNulls();
            parsed.UserCaseTypes.Should().HaveCountGreaterThan(0);
            parsed.UserCaseTypes.Should().BeEquivalentTo(userRole.CaseTypes);
        }

        [Test]
        public void Should_return_empty_list_of_user_case_types()
        {
            var userRole = new UserRole
            {
                UserRoleType = UserRoleType.VhOfficer
            };

            var created = new AdministratorRoleClaims(userRole);
            created.Should().NotBeNull();
            created.UserCaseTypes.Should().NotContainNulls();
            created.UserCaseTypes.Should().HaveCount(0);

            var parsed = new AdministratorRoleClaims(created.Claims);
            parsed.Should().NotBeNull();
            parsed.UserCaseTypes.Should().NotBeNull();
            parsed.UserCaseTypes.Should().NotContainNulls();
            parsed.UserCaseTypes.Should().HaveCount(0);
        }
    }
}