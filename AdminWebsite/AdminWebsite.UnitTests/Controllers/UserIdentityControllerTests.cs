using System.Collections.Generic;
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
        private Mock<IBookingsApiClient> _bookingsApiClientMock;

        private ClaimsPrincipal _claimsPrincipal;
        private JusticeUserResponse _justiceUserResponse;
        private List<JusticeUserResponse> _justiceUserListResponse;
        private UserIdentityController _controller;

        [SetUp]
        public void Setup()
        {
            _justiceUserResponse = new JusticeUserResponse
            {
                IsVhTeamLeader = true
            };

            

            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _bookingsApiClientMock.Setup(x => x.GetJusticeUserByUsernameAsync(It.IsAny<string>())).ReturnsAsync(_justiceUserResponse);
        }

        [Test]
        public async Task should_return_status_code_result_when_api_errors_with_non_404()
        {
            _claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.CaseAdminRole)
                .Build();
            _controller = SetupControllerWithClaims(_claimsPrincipal);

            _bookingsApiClientMock.Setup(x => x.GetJusticeUserByUsernameAsync(It.IsAny<string>()))
                .ThrowsAsync(new BookingsApiException("message", 400, "response", null, null));

            var response = await _controller.GetUserProfile();
            var result = response.Result.As<ObjectResult>();

            result.Should().NotBeNull();

            Assert.AreEqual(400, result.StatusCode);
        }

        [Test]
        public async Task should_not_mark_user_as_vh_lead_when_not_found()
        {
            _claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.CaseAdminRole)
                .Build();
            _controller = SetupControllerWithClaims(_claimsPrincipal);

            _bookingsApiClientMock.Setup(x => x.GetJusticeUserByUsernameAsync(It.IsAny<string>()))
                .ThrowsAsync(new BookingsApiException("not found message", 404, "not found response", null, null));

            var response = await _controller.GetUserProfile();
            var result = response.Result.As<ObjectResult>();

            result.Should().NotBeNull();
            var userProfile = (UserProfileResponse)result.Value;

            userProfile.IsVhTeamLeader.Should().BeFalse();
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
            _bookingsApiClientMock.Setup(x => x.GetJusticeUserListAsync(null)).ReturnsAsync(_justiceUserListResponse);
            
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
        
        [Test]
        public async Task should_get_empty_user_list_for_exception_404()
        {
            _claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.CaseAdminRole)
                .Build();

            _bookingsApiClientMock.Setup(x => x.GetJusticeUserListAsync(null))
                .ThrowsAsync(new BookingsApiException("not found message", 404, "not found response", null, null));
            
            _controller = SetupControllerWithClaims(_claimsPrincipal);
            var response = await _controller.GetUserList(null);
            var result = response.Result.As<OkObjectResult>();

            result.Should().NotBeNull();
            var userList = (List<JusticeUserResponse>) result.Value;

            userList.Count.Should().Be(0);
        }
        
        [Test]
        public async Task should_get_resultwith_message_for_exception_not_404()
        {
            _claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.CaseAdminRole)
                .Build();

            _bookingsApiClientMock.Setup(x => x.GetJusticeUserListAsync(null))
                .ThrowsAsync(new BookingsApiException("not found message", 400, "not found response", null, null));
            
            _controller = SetupControllerWithClaims(_claimsPrincipal);
            var response = await _controller.GetUserList(null);
            var result = response.Result.As<ObjectResult>();

            result.Should().NotBeNull();
            var message = (string) result.Value;

            message.Should().NotBeEmpty();
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