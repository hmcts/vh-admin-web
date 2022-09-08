using System.Security.Claims;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Controllers;
using AdminWebsite.Models;
using AdminWebsite.Testing.Common.Builders;
using BookingsApi.Client;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers
{
    public class UserIdentityControllerTests
    {
        private readonly Mock<IBookingsApiClient> _bookingsApiClientMock;

        private ClaimsPrincipal _claimsPrincipal;
        private JusticeUserResponse _justiceUserResponse;
        private UserIdentityController _controller;

        public UserIdentityControllerTests()
        {
            _justiceUserResponse = new JusticeUserResponse
            {
                IsVhTeamLeader = true
            };

            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _bookingsApiClientMock.Setup(x => x.GetJusticeUserByUsernameAsync(It.IsAny<string>())).ReturnsAsync(_justiceUserResponse);
        }

        [Test]
        public async Task should_retrieve_team_lead_status_from_bookings_api()
        {

            _claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.CaseAdminRole)
                .Build();
            _controller = SetupControllerWithClaims(_claimsPrincipal);
            var response = await _controller.GetUserProfile();
            var result = response.Result.As<OkObjectResult>();

            result.Should().NotBeNull();
            var userProfile = (UserProfileResponse)result.Value;

            userProfile.IsVhTeamLeader.Should().BeTrue();
        }

        [Test]
        public async Task should_get_profile_response_for_judge()
        {
            _claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.JudgeRole)
                .Build();
            _controller = SetupControllerWithClaims(_claimsPrincipal);
            var response = await _controller.GetUserProfile();
            var result = response.Result.As<OkObjectResult>();

            result.Should().NotBeNull();
            var userProfile = (UserProfileResponse) result.Value;

            userProfile.IsVhOfficerAdministratorRole.Should().BeFalse();
            userProfile.IsCaseAdministrator.Should().BeFalse();
        }
        
        [Test]
        public async Task should_get_profile_response_for_vho()
        {
            _claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.VhOfficerRole)
                .Build();
            _controller = SetupControllerWithClaims(_claimsPrincipal);
            var response = await _controller.GetUserProfile();
            var result = response.Result.As<OkObjectResult>();

            result.Should().NotBeNull();
            var userProfile = (UserProfileResponse) result.Value;

            userProfile.IsVhOfficerAdministratorRole.Should().BeTrue();
            userProfile.IsCaseAdministrator.Should().BeFalse();
        }
        
        [Test]
        public async Task should_get_profile_response_for_case_admin()
        {
            _claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.CaseAdminRole)
                .Build();
            _controller = SetupControllerWithClaims(_claimsPrincipal);
            var response = await _controller.GetUserProfile();
            var result = response.Result.As<OkObjectResult>();

            result.Should().NotBeNull();
            var userProfile = (UserProfileResponse) result.Value;

            userProfile.IsVhOfficerAdministratorRole.Should().BeFalse();
            userProfile.IsCaseAdministrator.Should().BeTrue();
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