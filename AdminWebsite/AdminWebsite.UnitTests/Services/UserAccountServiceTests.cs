using AdminWebsite.Configuration;
using AdminWebsite.Security;
using AdminWebsite.Services;
using Microsoft.Extensions.Options;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.UnitTests.Helper;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
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
        private Mock<IUserApiClient> _userApiClient;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<INotificationApiClient> _notificationApiClient;
        private Mock<IOptions<AzureAdConfiguration>> _azureAdConfiguration;
        private Mock<ILogger<UserAccountService>> _logger;

        private UserAccountService _service;

        [SetUp]
        public void Setup()
        {
            _userApiClient = new Mock<IUserApiClient>();
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _notificationApiClient = new Mock<INotificationApiClient>();
            _logger = new Mock<ILogger<UserAccountService>>();

            _azureAdConfiguration = new Mock<IOptions<AzureAdConfiguration>>();
            _azureAdConfiguration.Setup(x => x.Value)
                .Returns(new AzureAdConfiguration());

            _service = new UserAccountService(_userApiClient.Object, _bookingsApiClient.Object,
                _notificationApiClient.Object, _logger.Object);

            _userApiClient.Setup(x => x.GetUserByEmailAsync(It.IsAny<string>()))
                .Throws(ClientException.ForUserService(HttpStatusCode.NotFound));
        }

        [Test]
        public async Task AssignParticipantToGroup_IndividualtoExternalAADMemberUserGroup()
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
            _userApiClient.Verify(
                x => x.AddUserToGroupAsync(It.Is<AddUserToGroupRequest>(y =>
                    y.GroupName == UserAccountService.JudicialOfficeHolder)),
                Times.Never);

            _userApiClient.Verify(
                x => x.AddUserToGroupAsync(It.Is<AddUserToGroupRequest>(y =>
                    y.GroupName == UserAccountService.StaffMember)),
                Times.Never);
        }

        [Test]
        public async Task AssignParticipantToGroup_RepresentativeToProffesionalAADMemberUserGroup()
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
        public async Task AssignParticipantToGroup_JOHToJohAADMemberUserGroup()
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
        public async Task AssignParticipantToGroup_StaffMemberToAADMemberUserGroup()
        {
            await _service.AssignParticipantToGroup("staff@hmcts.net", "Staff Member");

            _userApiClient.Verify(
                x => x.AddUserToGroupAsync(
                    It.Is<AddUserToGroupRequest>(y => y.GroupName == UserAccountService.Internal)),
                Times.Once);
            _userApiClient.Verify(
                x => x.AddUserToGroupAsync(
                    It.Is<AddUserToGroupRequest>(y => y.GroupName == UserAccountService.StaffMember)),
                Times.Once);
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
            var userProfile = new UserProfile
            {
                UserName = "existingUser@hmcts.net", Email = "person@test.com", FirstName = "Person", LastName = "Test"
            };
            var updatedUserResponse = new UpdateUserResponse {NewPassword = "SomePassword"};

            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(userName))
                .ReturnsAsync(userProfile);

            _userApiClient.Setup(x => x.ResetUserPasswordAsync(userName)).ReturnsAsync(updatedUserResponse);

            await _service.ResetParticipantPassword(userName);

            _userApiClient.Verify(x => x.ResetUserPasswordAsync(userName), Times.Once);
            _notificationApiClient.Verify(x=> x.SendResetPasswordEmailAsync(It.Is<PasswordResetEmailRequest>(request => 
                request.Password.Equals(updatedUserResponse.NewPassword) && request.ContactEmail.Equals(userProfile.Email) && request.Name.Equals($"{userProfile.FirstName} {userProfile.LastName}")
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

        [Test]
        public void Should_throw_exception_when_add_user_to_group_has_null_user_name()
        {
            _userApiClient.Setup(x => x.AddUserToGroupAsync(It.IsAny<AddUserToGroupRequest>()))
                .Throws(ClientException.ForUserService(HttpStatusCode.InternalServerError));

            Assert.ThrowsAsync<UserApiException>(() =>
                _service.AssignParticipantToGroup(null, "Individual"));
        }
    }
}