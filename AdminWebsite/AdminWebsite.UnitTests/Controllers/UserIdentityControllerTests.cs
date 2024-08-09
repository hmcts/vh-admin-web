using System.Security.Claims;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Controllers;
using AdminWebsite.Models;
using AdminWebsite.Testing.Common.Builders;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AdminWebsite.UnitTests.Controllers
{
    public class UserIdentityControllerTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClientMock;

        private ClaimsPrincipal _claimsPrincipal;
        private List<JusticeUserResponse> _justiceUserListResponse;
        private UserIdentityController _controller;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
        }

        [Test]
        public void should_map_claims_to_user_profile()
        {
            _claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.CaseAdminRole)
                .WithRole(AppRoles.AdministratorRole)
                .Build();
            _controller = SetupControllerWithClaims(_claimsPrincipal);

            _bookingsApiClientMock.Setup(x => x.GetJusticeUserByUsernameAsync(It.IsAny<string>()))
                .ThrowsAsync(new BookingsApiException("not found message", 404, "not found response", null, null));

            var response = _controller.GetUserProfile();
            var result = response.Result.As<ObjectResult>();

            result.Should().NotBeNull();
            var userProfile = (UserProfileResponse)result.Value!;

            userProfile.IsVhTeamLeader.Should().BeTrue();
            userProfile.IsVhOfficerAdministratorRole.Should().BeTrue();
            userProfile.IsCaseAdministrator.Should().BeTrue();
        }

        [Test]
        public void should_get_profile_response_for_judge()
        {
            _claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.JudgeRole)
                .Build();
            _controller = SetupControllerWithClaims(_claimsPrincipal);
            var response = _controller.GetUserProfile();
            var result = response.Result.As<OkObjectResult>();

            result.Should().NotBeNull();
            var userProfile = (UserProfileResponse) result.Value;

            userProfile.IsVhOfficerAdministratorRole.Should().BeFalse();
            userProfile.IsCaseAdministrator.Should().BeFalse();
        }
        
        [Test]
        public void should_get_profile_response_for_vho()
        {
            _claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.VhOfficerRole)
                .Build();
            _controller = SetupControllerWithClaims(_claimsPrincipal);
            var response = _controller.GetUserProfile();
            var result = response.Result.As<OkObjectResult>();

            result.Should().NotBeNull();
            var userProfile = (UserProfileResponse) result.Value;

            userProfile.IsVhOfficerAdministratorRole.Should().BeTrue();
            userProfile.IsCaseAdministrator.Should().BeFalse();
        }
        
        [Test]
        public void should_get_profile_response_for_case_admin()
        {
            _claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.CaseAdminRole)
                .Build();
            _controller = SetupControllerWithClaims(_claimsPrincipal);
            var response = _controller.GetUserProfile();
            var result = response.Result.As<OkObjectResult>();

            result.Should().NotBeNull();
            var userProfile = (UserProfileResponse) result.Value;

            userProfile.IsVhOfficerAdministratorRole.Should().BeFalse();
            userProfile.IsCaseAdministrator.Should().BeTrue();
        }
        
        [Test]
        public async Task should_get_user_list()
        {
            _justiceUserListResponse = new List<JusticeUserResponse>();
            var user = new JusticeUserResponse
            {
                ContactEmail = "userName0@mail.com",
                Username = "userName0@mail.com",
                CreatedBy = "integration.test@test.com",
                FirstName = "firstName0",
                Lastname = "lastName0"
            };
            _justiceUserListResponse.Add(user);
            user = new JusticeUserResponse
            {
                ContactEmail = "userName1@mail.com",
                Username = "userName1@mail.com",
                CreatedBy = "integration.test@test.com",
                FirstName = "firstName1",
                Lastname = "lastName1"
            };
            _justiceUserListResponse.Add(user);
            _bookingsApiClientMock.Setup(x => x.GetJusticeUserListAsync(null, true)).ReturnsAsync(_justiceUserListResponse);
            
            _claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.CaseAdminRole)
                .Build();

            _controller = SetupControllerWithClaims(_claimsPrincipal);
            var response = await _controller.GetUserList(null);
            var result = response.Result.As<OkObjectResult>();

            result.Should().NotBeNull();
            var userList = (List<JusticeUserResponse>) result.Value;

            userList.Count.Should().Be(2);
        }
        
        private UserIdentityController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
        {
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            return new UserIdentityController(_bookingsApiClientMock.Object)
            {
                ControllerContext = context
            };
        }
    }
}