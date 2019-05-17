using System.Security.Claims;
using AdminWebsite.Security;
using AdminWebsite.Services;
using FluentAssertions;
using Microsoft.Graph;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Security
{
    public class UserIdentityTests
    {
        private Mock<IUserAccountService> _userAccountService;

        [SetUp]
        public void Setup()
        {
            _userAccountService = new Mock<IUserAccountService>();
        }

        [Test]
        public void should_return_the_display_names_of_assigned_case_types()
        {
            // given there are two groups assigned to the user identity
            var financialRemedyClaim = new Claim("groups", "financial");
            var civilMoneyClaim = new Claim("groups", "civil");
            var user = new TestPrincipal(financialRemedyClaim, civilMoneyClaim);
            
            // and those two groups maps to the administrator roles
            _userAccountService.Setup(x => x.GetGroupById(financialRemedyClaim.Value))
                .Returns(new UserAPI.Client.GroupsResponse {Display_name = "Financial Remedy"});
            
            _userAccountService.Setup(x => x.GetGroupById(civilMoneyClaim.Value))
                .Returns(new UserAPI.Client.GroupsResponse { Display_name = "Civil Money Claims"});
            
            // then the user should have rights to the two groups
            var userIdentity = new UserIdentity(user, _userAccountService.Object);
            var caseTypes = userIdentity.GetAdministratorCaseTypes();
            caseTypes.Should().Contain("Civil Money Claims");
            caseTypes.Should().Contain("Financial Remedy");
        }
    }
}