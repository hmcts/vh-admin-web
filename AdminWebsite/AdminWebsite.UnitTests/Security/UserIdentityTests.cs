using AdminWebsite.Helper;
using AdminWebsite.Security;
using AdminWebsite.Services.Models;
using FluentAssertions;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace AdminWebsite.UnitTests.Security
{
    public class UserIdentityTests
    {
        [Test]
        public void Should_return_the_display_names_of_assigned_case_types()
        {
            var administratorRoleClaims = new AdministratorRoleClaims(new UserRole
            {
                CaseTypes = new List<string> { "Civil Money Claims", "Financial Remedy" }
            });

            var user = new TestPrincipal(administratorRoleClaims.Claims);
            var caseTypes = new UserIdentity(user).GetAdministratorCaseTypes().ToList();

            caseTypes.Should().NotBeNull();
            caseTypes.Should().HaveCount(caseTypes.Count);
            caseTypes.Should().Contain("Civil Money Claims");
            caseTypes.Should().Contain("Financial Remedy");
        }

        [Test]
        public void Should_return_group_display_names()
        {
            var administratorRoleClaims = new AdministratorRoleClaims(new UserRole
            {
                CaseTypes = new List<string> { "Civil Money Claims", "Financial Remedy" }
            });

            var user = new TestPrincipal(administratorRoleClaims.Claims);
            var caseTypes = new UserIdentity(user).GetGroupDisplayNames().ToList();

            caseTypes.Should().NotBeNull();
            caseTypes.Should().HaveCount(caseTypes.Count);
            caseTypes.Should().Contain("Civil Money Claims");
            caseTypes.Should().Contain("Financial Remedy");
        }

        [TestCase(UserRoleType.None, false)]
        [TestCase(UserRoleType.VhOfficer, true)]
        [TestCase(UserRoleType.CaseAdmin, false)]
        [TestCase(UserRoleType.Individual, false)]
        [TestCase(UserRoleType.Judge, false)]
        [TestCase(UserRoleType.Representative, false)]
        public void Should_set_the_isvhofficeradministratorrole_property(UserRoleType userRoleType, bool expectedValue)
        {
            var administratorRoleClaims = new AdministratorRoleClaims(new UserRole
            {
                UserRoleType = userRoleType
            });

            var user = new TestPrincipal(administratorRoleClaims.Claims);
            var userIdentity = new UserIdentity(user);

            userIdentity.Should().NotBeNull();
            userIdentity.IsVhOfficerAdministratorRole().Should().Be(expectedValue);
        }

        [TestCase(UserRoleType.None, false)]
        [TestCase(UserRoleType.VhOfficer, false)]
        [TestCase(UserRoleType.CaseAdmin, true)]
        [TestCase(UserRoleType.Individual, false)]
        [TestCase(UserRoleType.Judge, false)]
        [TestCase(UserRoleType.Representative, false)]
        public void Should_set_the_iscaseadministratorrole_property(UserRoleType userRoleType, bool expectedValue)
        {
            var administratorRoleClaims = new AdministratorRoleClaims(new UserRole
            {
                UserRoleType = userRoleType
            });

            var user = new TestPrincipal(administratorRoleClaims.Claims);
            var userIdentity = new UserIdentity(user);

            userIdentity.Should().NotBeNull();
            userIdentity.IsCaseAdministratorRole().Should().Be(expectedValue);
        }

        [TestCase(UserRoleType.None, false)]
        [TestCase(UserRoleType.VhOfficer, true)]
        [TestCase(UserRoleType.CaseAdmin, true)]
        [TestCase(UserRoleType.Individual, false)]
        [TestCase(UserRoleType.Judge, false)]
        [TestCase(UserRoleType.Representative, false)]
        public void Should_set_the_isadministratorrole_property(UserRoleType userRoleType, bool expectedValue)
        {
            var administratorRoleClaims = new AdministratorRoleClaims(new UserRole
            {
                UserRoleType = userRoleType
            });

            var user = new TestPrincipal(administratorRoleClaims.Claims);
            var userIdentity = new UserIdentity(user);

            userIdentity.Should().NotBeNull();
            userIdentity.IsAdministratorRole().Should().Be(expectedValue);
        }

        [Test]
        public void Should_return_the_username()
        {
            const string name = "Someone@somewhere.com";
            var administratorRoleClaims = new AdministratorRoleClaims(new UserRole
            {
                UserRoleType = UserRoleType.None
            });
            var usernameClaim = new Claim(ClaimTypes.Name, name);
            var user = new TestPrincipal(administratorRoleClaims.Claims.Union(new List<Claim>{ usernameClaim }));

            var userIdentity = new UserIdentity(user);

            userIdentity.Should().NotBeNull();
            userIdentity.GetUserIdentityName().Should().Be(name);
        }
    }
}