using AdminWebsite.Helper;
using AdminWebsite.Security;
using AdminWebsite.Services.Models;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace AdminWebsite.UnitTests.Helper
{
    public class AdministratorRoleClaimsTest
    {
        [Test]
        public void should_return_user_case_types()
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
        public void should_return_empty_list_of_user_case_types()
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

        [TestCase(UserRoleType.None, false)]
        [TestCase(UserRoleType.VhOfficer, true)]
        [TestCase(UserRoleType.CaseAdmin, false)]
        [TestCase(UserRoleType.Individual, false)]
        [TestCase(UserRoleType.Judge, false)]
        [TestCase(UserRoleType.Representative, false)]
        public void should_set_isvhofficeradministratorrole_property(UserRoleType role, bool expectedValue)
        {
            var userGroupData = new UserRole { UserRoleType = role };

            var created = new AdministratorRoleClaims(userGroupData);
            created.IsVhOfficerAdministratorRole.Should().Be(expectedValue);

            var parsed = new AdministratorRoleClaims(created.Claims);
            parsed.IsVhOfficerAdministratorRole.Should().Be(expectedValue);
        }

        [TestCase(UserRoleType.None, false)]
        [TestCase(UserRoleType.VhOfficer, false)]
        [TestCase(UserRoleType.CaseAdmin, true)]
        [TestCase(UserRoleType.Individual, false)]
        [TestCase(UserRoleType.Judge, false)]
        [TestCase(UserRoleType.Representative, false)]
        public void should_set_iscaseadministratorrole_property(UserRoleType role, bool expectedValue)
        {
            var userGroupData = new UserRole { UserRoleType = role };

            var created = new AdministratorRoleClaims(userGroupData);
            created.IsCaseAdministratorRole.Should().Be(expectedValue);

            var parsed = new AdministratorRoleClaims(created.Claims);
            parsed.IsCaseAdministratorRole.Should().Be(expectedValue);
        }

        [TestCase(UserRoleType.None, false)]
        [TestCase(UserRoleType.VhOfficer, true)]
        [TestCase(UserRoleType.CaseAdmin, true)]
        [TestCase(UserRoleType.Individual, false)]
        [TestCase(UserRoleType.Judge, false)]
        [TestCase(UserRoleType.Representative, false)]
        public void should_set_isadministratorrole_property(UserRoleType role, bool expectedValue)
        {
            var userGroupData = new UserRole { UserRoleType = role };

            var created = new AdministratorRoleClaims(userGroupData);
            created.IsAdministratorRole.Should().Be(expectedValue);

            var parsed = new AdministratorRoleClaims(created.Claims);
            parsed.IsAdministratorRole.Should().Be(expectedValue);
        }

        [Test]
        public void should_throw_argumentnullexception_when_claims_are_missing()
        {
            Assert.Throws<ArgumentNullException>
            (
                () => new AdministratorRoleClaims(Enumerable.Empty<Claim>())
            );
        }
    }
}