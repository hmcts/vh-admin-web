using AdminWebsite.Helper;
using AdminWebsite.Security;
using AdminWebsite.Services.Models;
using System.Linq;
using AdminWebsite.Models;
using AdminWebsite.Testing.Common.Builders;

namespace AdminWebsite.UnitTests.Security
{
    public class UserIdentityTests
    {
        [Test]
        public void Should_return_the_DisplayNames_of_assigned_case_types()
        {
            var administratorRoleClaims = new AdministratorRoleClaims(new UserRole
            {
                CaseTypes = new List<string> { "Generic", "Financial Remedy" }
            });

            var user = new TestPrincipal(administratorRoleClaims.Claims);
            var caseTypes = new UserIdentity(user).GetAdministratorCaseTypes().ToList();

            caseTypes.Should().NotBeNull();
            caseTypes.Should().HaveCount(caseTypes.Count);
            caseTypes.Should().Contain("Generic");
            caseTypes.Should().Contain("Financial Remedy");
        }

        [Test]
        public void Should_return_group_DisplayNames()
        {
            var administratorRoleClaims = new AdministratorRoleClaims(new UserRole
            {
                CaseTypes = new List<string> { "Generic", "Financial Remedy" }
            });

            var user = new TestPrincipal(administratorRoleClaims.Claims);
            var caseTypes = new UserIdentity(user).GetGroupDisplayNames().ToList();

            caseTypes.Should().NotBeNull();
            caseTypes.Should().HaveCount(caseTypes.Count);
            caseTypes.Should().Contain("Generic");
            caseTypes.Should().Contain("Financial Remedy");
        }

        [TestCase(AppRoles.CitizenRole, false)]
        [TestCase(AppRoles.JudgeRole, false)]
        [TestCase(AppRoles.RepresentativeRole, false)]
        [TestCase(AppRoles.CaseAdminRole, false)]
        [TestCase(AppRoles.VhOfficerRole, false)]
        [TestCase(AppRoles.AdministratorRole, true)]
        public void Should_set_the_isvhofficeradministratorrole_property(string appRole, bool expectedValue)
        {
            var user = new ClaimsPrincipalBuilder().WithRole(appRole).Build();
            var userIdentity = new UserIdentity(user);
            userIdentity.IsATeamLead().Should().Be(expectedValue);
        }

        [TestCase(AppRoles.CitizenRole, false)]
        [TestCase(AppRoles.JudgeRole, false)]
        [TestCase(AppRoles.RepresentativeRole, false)]
        [TestCase(AppRoles.VhOfficerRole, true)]
        [TestCase(AppRoles.AdministratorRole, false)]
        public void Should_set_the_is_a_cso_role_property(string appRole, bool expectedValue)
        {
            var user = new ClaimsPrincipalBuilder().WithRole(appRole).Build();
            var userIdentity = new UserIdentity(user);
            userIdentity.IsACso().Should().Be(expectedValue);
        }

        [Test]
        public void Should_return_the_username()
        {
            const string username = "Someone@hmcts.net";
            var user = new ClaimsPrincipalBuilder().WithUsername(username).Build();
            var userIdentity = new UserIdentity(user);

            userIdentity.Should().NotBeNull();
            userIdentity.GetUserIdentityName().Should().Be(username);
        }
    }
}