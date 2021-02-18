using System;
using AdminWebsite.Configuration;
using AdminWebsite.Helper;
using AdminWebsite.Security;
using AdminWebsite.Services;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.UnitTests.Helper;
using Microsoft.Extensions.Logging;
using NotificationApi.Client;
using NotificationApi.Contract;
using NotificationApi.Contract.Requests;
using UserApi.Client;
using UserApi.Contract.Requests;
using UserApi.Contract.Responses;
using UserServiceException = AdminWebsite.Security.UserServiceException;

namespace AdminWebsite.UnitTests.Services
{
    public class UserAccountServiceTests
    {
        private Mock<IOptions<AppConfigSettings>> _appSettings;
        private Mock<IUserApiClient> _userApiClient;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<INotificationApiClient> _notificationApiClient;
        private Mock<IOptions<SecuritySettings>> _securitySettings;
        private Mock<ILogger<UserAccountService>> _logger;

        private UserAccountService _service;

        [SetUp]
        public void Setup()
        {
            _userApiClient = new Mock<IUserApiClient>();
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _notificationApiClient = new Mock<INotificationApiClient>();
            _logger = new Mock<ILogger<UserAccountService>>();
            _appSettings = new Mock<IOptions<AppConfigSettings>>();
            _appSettings.Setup(x => x.Value)
                .Returns(new AppConfigSettings());

            _securitySettings = new Mock<IOptions<SecuritySettings>>();
            _securitySettings.Setup(x => x.Value)
                .Returns(new SecuritySettings());

            _service = new UserAccountService(_userApiClient.Object, _bookingsApiClient.Object,
                _notificationApiClient.Object, _logger.Object);

            _userApiClient.Setup(x => x.GetUserByEmailAsync(It.IsAny<string>()))
                .Throws(ClientException.ForUserService(HttpStatusCode.NotFound));
        }

        [Test]
        public void Should_fail_if_we_cannot_figure_out_user_existence()
        {
            _userApiClient.Setup(x => x.GetUserByEmailAsync(It.IsAny<string>()))
                .Throws(ClientException.ForUserService(HttpStatusCode.InternalServerError));

            Assert.ThrowsAsync<UserApiException>(() =>
                _service.UpdateParticipantUsername(new BookingsAPI.Client.ParticipantRequest()));
        }

        [Test]
        public async Task Should_add_individual_to_external_user_group_only()
        {
            await _service.AssignParticipantToGroup("rep@hmcts.net", "Individual");

            _userApiClient.Verify(
                x => x.AddUserToGroupAsync(
                    It.Is<AddUserToGroupRequest>(y => y.GroupName == UserAccountService.External)),
                Times.Once);
            _userApiClient.Verify(
                x => x.AddUserToGroupAsync(It.Is<AddUserToGroupRequest>(y =>
                    y.GroupName == UserAccountService.VirtualRoomProfessionalUser)),
                Times.Never);
        }

        [Test]
        public async Task Should_add_representative_to_professional_user_group()
        {
            await _service.AssignParticipantToGroup("rep@hmcts.net", "Representative");

            _userApiClient.Verify(
                x => x.AddUserToGroupAsync(
                    It.Is<AddUserToGroupRequest>(y => y.GroupName == UserAccountService.External)),
                Times.Once);
            _userApiClient.Verify(
                x => x.AddUserToGroupAsync(It.Is<AddUserToGroupRequest>(y =>
                    y.GroupName == UserAccountService.VirtualRoomProfessionalUser)),
                Times.Once);
        }

        [Test]
        public async Task Should_add_JOH_role_to_JOH_user_group()
        {
            await _service.AssignParticipantToGroup("rep@hmcts.net", "Judicial Office Holder");

            _userApiClient.Verify(
                x => x.AddUserToGroupAsync(
                    It.Is<AddUserToGroupRequest>(y => y.GroupName == UserAccountService.External)),
                Times.Once);
            _userApiClient.Verify(
                x => x.AddUserToGroupAsync(
                    It.Is<AddUserToGroupRequest>(y => y.GroupName == UserAccountService.JudicialOfficeHolder)),
                Times.Once);
        }

        [Test]
        public async Task Should_not_create_users_that_already_exists()
        {
            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = "existin@hmcts.net"
            };

            _userApiClient.Setup(x => x.GetUserByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync(new UserProfile {UserName = participant.Username});

            await _service.UpdateParticipantUsername(participant);

            _userApiClient.Verify(x => x.CreateUserAsync(It.IsAny<CreateUserRequest>()), Times.Never);
        }

        [Test]
        public async Task Should_create_users_if_not_exists()
        {
            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                First_name = "First Name Space",
                Last_name = "Last Name Space",
                Username = "notexistin@hmcts.net"
            };

            _userApiClient.Setup(x => x.GetUserByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync((UserProfile) null);
            _userApiClient.Setup(x => x.CreateUserAsync(It.IsAny<CreateUserRequest>()))
                .ReturnsAsync(new NewUserResponse {Username = participant.Username});

            await _service.UpdateParticipantUsername(participant);

            _userApiClient.Verify(x => x.CreateUserAsync(It.Is<CreateUserRequest>(c =>
                c.FirstName == participant.First_name.Replace(" ", string.Empty)
                && c.LastName == participant.Last_name.Replace(" ", string.Empty)
                && !c.IsTestUser
            )), Times.Once);
        }

        [Test]
        public async Task GetUserGroupDataAsync_Returns_UserGroupData()
        {
            var userRole = UserRoleType.VhOfficer;
            var caseType = new List<string> {"one", "two"};

            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>()))
                .ReturnsAsync(new UserProfile {UserRole = userRole.ToString(), CaseType = caseType});

            var result = await _service.GetUserRoleAsync(It.IsAny<string>());

            result.Should().NotBeNull();
            result.UserRoleType.Should().Be(userRole);
            result.CaseTypes.Should().BeEquivalentTo(caseType);
        }

        [Test]
        public async Task Should_update_password_if_a_user_was_found_in_aad()
        {
            const string userName = "existingUser";
            var userProfile = new UserProfile {UserName = "existingUser@hmcts.net"};
            var updatedUserResponse = new UpdateUserResponse {NewPassword = "SomePassword"};

            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(userName))
                .ReturnsAsync(userProfile);

            _userApiClient.Setup(x => x.ResetUserPasswordAsync(userName)).ReturnsAsync(updatedUserResponse);

            await _service.ResetParticipantPassword(userName);

            _userApiClient.Verify(x => x.ResetUserPasswordAsync(userName), Times.Once);
            _notificationApiClient.Verify(x=> x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(request => 
                request.NotificationType ==NotificationType.PasswordReset && request.Parameters.ContainsValue(updatedUserResponse.NewPassword)
                )));
        }

        [Test]
        public void Should_throw_exception_on_update_password()
        {
            const string userName = "existingUser";

            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(userName))
                .ReturnsAsync((UserProfile) null);


            var exception =
                Assert.ThrowsAsync<UserServiceException>(() => _service.ResetParticipantPassword(userName));

            exception.Reason.Should().Be("Unable to generate new password");
        }

        [Test]
        public async Task should_remove_user_in_ad_and_bookings_api()
        {
            var username = "valid.user@hmcts.net";
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(username))
                .ReturnsAsync(new List<HearingsByUsernameForDeletionResponse>());

            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(username))
                .ReturnsAsync(new UserProfile {UserRole = UserRoleType.Individual.ToString()});

            await _service.DeleteParticipantAccountAsync(username);

            _userApiClient.Verify(x => x.DeleteUserAsync(username), Times.Once);
            _bookingsApiClient.Verify(x => x.AnonymisePersonWithUsernameAsync(username), Times.Once);
        }

        [Test]
        public async Task should_remove_user_in_ad_but_not_bookings_api()
        {
            var username = "valid.user@hmcts.net";
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(It.IsAny<string>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));

            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(username))
                .ReturnsAsync(new UserProfile {UserRole = UserRoleType.Individual.ToString()});

            await _service.DeleteParticipantAccountAsync(username);

            _userApiClient.Verify(x => x.DeleteUserAsync(username), Times.Once);
            _bookingsApiClient.Verify(x => x.AnonymisePersonWithUsernameAsync(username), Times.Never);
        }

        [Test]
        public async Task should_remove_user_in_bookings_api_but_not_ad()
        {
            var username = "valid.user@hmcts.net";
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(username))
                .ReturnsAsync(new List<HearingsByUsernameForDeletionResponse>());

            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(username))
                .ThrowsAsync(ClientException.ForUserService(HttpStatusCode.NotFound));

            await _service.DeleteParticipantAccountAsync(username);

            _userApiClient.Verify(x => x.DeleteUserAsync(username), Times.Never);
            _bookingsApiClient.Verify(x => x.AnonymisePersonWithUsernameAsync(username), Times.Once);
        }

        [Test]
        public void should_fail_to_delete_judge_account()
        {
            var username = "valid.user@hmcts.net";
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(username))
                .ReturnsAsync(new List<HearingsByUsernameForDeletionResponse>());

            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(username))
                .ReturnsAsync(new UserProfile {UserRole = UserRoleType.Judge.ToString()});

            var exception =
                Assert.ThrowsAsync<UserServiceException>(() => _service.DeleteParticipantAccountAsync(username));
            exception.Reason.Should().Be("Unable to delete account with role Judge");

            _userApiClient.Verify(x => x.DeleteUserAsync(username), Times.Never);
            _bookingsApiClient.Verify(x => x.AnonymisePersonWithUsernameAsync(username), Times.Never);
        }

        [Test]
        public void should_fail_to_delete_admin()
        {
            var username = "valid.user@hmcts.net";
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(username))
                .ReturnsAsync(new List<HearingsByUsernameForDeletionResponse>());

            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(username))
                .ReturnsAsync(new UserProfile {UserRole = UserRoleType.VhOfficer.ToString()});

            var exception =
                Assert.ThrowsAsync<UserServiceException>(() => _service.DeleteParticipantAccountAsync(username));
            exception.Reason.Should().Be("Unable to delete account with role VhOfficer");

            _userApiClient.Verify(x => x.DeleteUserAsync(username), Times.Never);
            _bookingsApiClient.Verify(x => x.AnonymisePersonWithUsernameAsync(username), Times.Never);
        }

        [Test]
        public void should_fail_to_delete_account_when_user_api_throws()
        {
            var username = "valid.user@hmcts.net";
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(username))
                .ReturnsAsync(new List<HearingsByUsernameForDeletionResponse>());

            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(username))
                .ThrowsAsync(ClientException.ForUserService(HttpStatusCode.InternalServerError));

            Assert.ThrowsAsync<UserApiException>(() => _service.DeleteParticipantAccountAsync(username));

            _userApiClient.Verify(x => x.DeleteUserAsync(username), Times.Never);
            _bookingsApiClient.Verify(x => x.AnonymisePersonWithUsernameAsync(username), Times.Never);
        }

        [Test]
        public void should_fail_to_delete_account_when_bookings_api_throws()
        {
            var username = "valid.user@hmcts.net";
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(username))
                .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));

            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(username))
                .ReturnsAsync(new UserProfile {UserRole = UserRoleType.Individual.ToString()});

            Assert.ThrowsAsync<BookingsApiException>(() => _service.DeleteParticipantAccountAsync(username));

            _userApiClient.Verify(x => x.DeleteUserAsync(username), Times.Once);
            _bookingsApiClient.Verify(x => x.AnonymisePersonWithUsernameAsync(username), Times.Never);
        }

        [Test]
        public async Task should_return_user_ad_id_for_username()
        {
            var profile = new UserProfile
            {
                UserId = Guid.NewGuid().ToString()
            };
            _userApiClient.Setup(x => x.GetUserByAdUserIdAsync(It.IsAny<string>()))
                .ReturnsAsync(profile);


            var id = await _service.GetAdUserIdForUsername("do_not_exist@hmcts.net");
            id.Should().Be(profile.UserId);
        }

        [Test]
        public async Task should_return_null_when_username_not_found()
        {
            _userApiClient.Setup(x => x.GetUserByAdUserIdAsync(It.IsAny<string>()))
                .Throws(ClientException.ForUserService(HttpStatusCode.NotFound));


            var id = await _service.GetAdUserIdForUsername("do_not_exist@hmcts.net");
            id.Should().BeNull();
        }

        [Test]
        public void should_throw_exception_when_username_not_found_throws()
        {
            _userApiClient.Setup(x => x.GetUserByAdUserIdAsync(It.IsAny<string>()))
                .Throws(ClientException.ForUserService(HttpStatusCode.InternalServerError));

            Assert.ThrowsAsync<UserApiException>(() =>
                _service.GetAdUserIdForUsername("123"));
        }
    }
}