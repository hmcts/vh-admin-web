using AdminWebsite.Security;
using FluentAssertions;
using NUnit.Framework;
using System.Linq;
using System.Security.Claims;

namespace AdminWebsite.UnitTests.Security
{
    public class UserIdentityTests
    {
        [Test]
        public void should_return_the_display_names_of_assigned_case_types()
        {
            // given there are two groups assigned to the user identity
            var user = new TestPrincipal(new Claim("UserCaseTypes", "MoneyClaims,FinancialRemedy"));

            // then the user should have rights to the two groups
            var userIdentity = new UserIdentity(user);
            var caseTypes = userIdentity.GetAdministratorCaseTypes().ToList();

            caseTypes.Should().NotBeNull();
            caseTypes.Should().Contain("MoneyClaims");
            caseTypes.Should().Contain("FinancialRemedy");
        }

        [Test]
        public void GetGroupDisplayNames_Returns_UserCaseType()
        {
            var user = new TestPrincipal(new Claim("UserCaseTypes", "MoneyClaims,FinancialRemedy"));

            var userIdentity = new UserIdentity(user);
            var caseTypes = userIdentity.GetGroupDisplayNames().ToList();

            caseTypes.Should().NotBeNull();
            caseTypes.Should().Contain("MoneyClaims");
            caseTypes.Should().Contain("FinancialRemedy");
        }

        [TestCase(true)]
        [TestCase(false)]
        [TestCase(null)]
        public void IsAdministratorRole_Returns_Correct_Value(bool? state)
        {
            var user = new TestPrincipal(new Claim("IsAdministratorRole", state.ToString()));

            var userIdentity = new UserIdentity(user);

            userIdentity.Should().NotBeNull();
            userIdentity.IsAdministratorRole().Should().Be(state ?? false);
        }

        [TestCase(true)]
        [TestCase(false)]
        [TestCase(null)]
        public void IsVhOfficerAdministratorRole_Returns_Correct_Value(bool? state)
        {
            var user = new TestPrincipal(new Claim("IsVhOfficerAdministratorRole", state.ToString()));

            var userIdentity = new UserIdentity(user);

            userIdentity.Should().NotBeNull();
            userIdentity.IsVhOfficerAdministratorRole().Should().Be(state ?? false);
        }

        [TestCase(true)]
        [TestCase(false)]
        [TestCase(null)]
        public void IsCaseAdministratorRole_Returns_Correct_Value(bool? state)
        {
            var user = new TestPrincipal(new Claim("IsCaseAdministratorRole", state.ToString()));

            var userIdentity = new UserIdentity(user);

            userIdentity.Should().NotBeNull();
            userIdentity.IsCaseAdministratorRole().Should().Be(state ?? false);
        }

        [Test]
        public void GetUserIdentityName_Returns_False_Claim_Not_Exist()
        {
            const string name = "Someone@somewhere.com";
            var user = new TestPrincipal(new Claim(ClaimTypes.Name, name));

            var userIdentity = new UserIdentity(user);

            userIdentity.Should().NotBeNull();
            userIdentity.GetUserIdentityName().Should().Be(name);
        }
    }
}