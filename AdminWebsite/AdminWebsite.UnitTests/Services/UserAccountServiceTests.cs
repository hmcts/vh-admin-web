using System.Collections.Generic;
using AdminWebsite.Configuration;
using AdminWebsite.Helper;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UserAPI.Client;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Services.Models;
using FluentAssertions;
using Testing.Common;

namespace AdminWebsite.UnitTests.Services
{
    public class UserAccountServiceTests
    {
        private Mock<IOptions<AppConfigSettings>> _appSettings;
        private Mock<IUserApiClient> _userApiClient;
        private Mock<ITokenProvider> _tokenProvider;
        private Mock<IOptions<SecuritySettings>> _securitySettings;

        private UserAccountService _service;

        [SetUp]
        public void Setup()
        {
            _userApiClient = new Mock<IUserApiClient>();
            _tokenProvider = new Mock<ITokenProvider>();

            _appSettings = new Mock<IOptions<AppConfigSettings>>();
            _appSettings.Setup(x => x.Value)
                .Returns(new AppConfigSettings());

            _securitySettings = new Mock<IOptions<SecuritySettings>>();
            _securitySettings.Setup(x => x.Value)
                .Returns(new SecuritySettings());

            _service = new UserAccountService(
                _userApiClient.Object,
                _tokenProvider.Object,
                _securitySettings.Object,
                _appSettings.Object
            );

            _userApiClient.Setup(x => x.GetUserByEmailAsync(It.IsAny<string>()))
                .Throws(ClientException.ForUserService(HttpStatusCode.NotFound));
        }

        [Test]
        public void should_fail_if_we_cannot_figure_out_user_existence()
        {
            _userApiClient.Setup(x => x.GetUserByEmailAsync(It.IsAny<string>()))
                .Throws(ClientException.ForUserService(HttpStatusCode.InternalServerError));

            Assert.ThrowsAsync<UserAPI.Client.UserServiceException>(() =>
                _service.UpdateParticipantUsername(new BookingsAPI.Client.ParticipantRequest()));
        }

        [Test]
        public async Task should_add_new_individuals_to_external_group()
        {
            _userApiClient.Setup(x => x.CreateUserAsync(It.IsAny<CreateUserRequest>()))
                .ReturnsAsync(new NewUserResponse());

            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = "existin@user.com"
            };

            await _service.UpdateParticipantUsername(participant);

            _userApiClient.Verify(x => x.AddUserToGroupAsync(It.Is<AddUserToGroupRequest>(y => y.Group_name == "External")),
                Times.Once);
        }

        [Test]
        public async Task should_add_solicitor_to_professional_user_group()
        {
            _userApiClient.Setup(x => x.CreateUserAsync(It.IsAny<CreateUserRequest>()))
                .ReturnsAsync(new NewUserResponse());

            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = "existin@user.com",
                Hearing_role_name = "Solicitor"
            };

            await _service.UpdateParticipantUsername(participant);

            _userApiClient.Verify(x => x.AddUserToGroupAsync(It.Is<AddUserToGroupRequest>(y => y.Group_name == "VirtualRoomProfessionalUser")),
                Times.Once);
        }

        [Test]
        public async Task should_not_create_users_that_already_exists()
        {
            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = "existin@user.com"
            };

            _userApiClient.Setup(x => x.GetUserByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync(new UserProfile { User_name = participant.Username });

            await _service.UpdateParticipantUsername(participant);

            _userApiClient.Verify(x => x.CreateUserAsync(It.IsAny<CreateUserRequest>()), Times.Never);
        }

        [Test]
        public async Task GetUserGroupDataAsync_Returns_UserGroupData()
        {
            var userRole = UserRoleType.VhOfficer;
            var caseType = new List<string>{"one", "two"};

            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>()))
                .ReturnsAsync(new UserProfile { User_role = userRole.ToString(), Case_type = caseType});

            var result = await _service.GetUserRoleAsync(It.IsAny<string>());

            result.Should().NotBeNull();
            result.UserRoleType.Should().Be(userRole);
            result.CaseTypes.Should().BeEquivalentTo(caseType);
        }
    }
}