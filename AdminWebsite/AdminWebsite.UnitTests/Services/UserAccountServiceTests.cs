using System;
using AdminWebsite.Configuration;
using AdminWebsite.Helper;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UserAPI.Client;
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
using UserServiceException = AdminWebsite.Security.UserServiceException;

namespace AdminWebsite.UnitTests.Services
{
    public class UserAccountServiceTests
    {
        private Mock<IOptions<AppConfigSettings>> _appSettings;
        private Mock<IUserApiClient> _userApiClient;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IOptions<SecuritySettings>> _securitySettings;
        private Mock<ILogger<UserAccountService>> _logger;

        private UserAccountService _service;

        [SetUp]
        public void Setup()
        {
            _userApiClient = new Mock<IUserApiClient>();
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _logger = new Mock<ILogger<UserAccountService>>();
            _appSettings = new Mock<IOptions<AppConfigSettings>>();
            _appSettings.Setup(x => x.Value)
                .Returns(new AppConfigSettings());

            _securitySettings = new Mock<IOptions<SecuritySettings>>();
            _securitySettings.Setup(x => x.Value)
                .Returns(new SecuritySettings());

            _service = new UserAccountService(_userApiClient.Object, _bookingsApiClient.Object, _logger.Object);

            _userApiClient.Setup(x => x.GetUserByEmailAsync(It.IsAny<string>()))
                .Throws(ClientException.ForUserService(HttpStatusCode.NotFound));
        }

        [Test]
        public void Should_fail_if_we_cannot_figure_out_user_existence()
        {
            _userApiClient.Setup(x => x.GetUserByEmailAsync(It.IsAny<string>()))
                .Throws(ClientException.ForUserService(HttpStatusCode.InternalServerError));

            Assert.ThrowsAsync<UserAPI.Client.UserServiceException>(() =>
                _service.UpdateParticipantUsername(new BookingsAPI.Client.ParticipantRequest()));
        }
        
        [Test]
        public async Task Should_add_individual_to_external_user_group_only()
        {
            await _service.AssignParticipantToGroup("rep@test.com","Individual");

            _userApiClient.Verify(x => x.AddUserToGroupAsync(It.Is<AddUserToGroupRequest>(y => y.Group_name == UserAccountService.External)),
                Times.Once);
            _userApiClient.Verify(x => x.AddUserToGroupAsync(It.Is<AddUserToGroupRequest>(y => y.Group_name == UserAccountService.VirtualRoomProfessionalUser)),
                Times.Never);
        }

        [Test]
        public async Task Should_add_representative_to_professional_user_group()
        {
            await _service.AssignParticipantToGroup("rep@test.com","Representative");

            _userApiClient.Verify(x => x.AddUserToGroupAsync(It.Is<AddUserToGroupRequest>(y => y.Group_name == UserAccountService.External)),
                Times.Once);
            _userApiClient.Verify(x => x.AddUserToGroupAsync(It.Is<AddUserToGroupRequest>(y => y.Group_name == UserAccountService.VirtualRoomProfessionalUser)),
                Times.Once);
        }

        [Test]
        public async Task Should_add_JOH_role_to_JOH_user_group()
        {
            await _service.AssignParticipantToGroup("rep@test.com", "Judicial Office Holder");

            _userApiClient.Verify(x => x.AddUserToGroupAsync(It.Is<AddUserToGroupRequest>(y => y.Group_name == UserAccountService.External)),
                Times.Once);
            _userApiClient.Verify(x => x.AddUserToGroupAsync(It.Is<AddUserToGroupRequest>(y => y.Group_name == UserAccountService.JudicialOfficeHolder)),
                Times.Once);
        }

        [Test]
        public async Task Should_not_create_users_that_already_exists()
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
            var caseType = new List<string> { "one", "two" };

            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>()))
                .ReturnsAsync(new UserProfile { User_role = userRole.ToString(), Case_type = caseType });

            var result = await _service.GetUserRoleAsync(It.IsAny<string>());

            result.Should().NotBeNull();
            result.UserRoleType.Should().Be(userRole);
            result.CaseTypes.Should().BeEquivalentTo(caseType);
        }

        [Test]
        public async Task Should_update_password_if_a_user_was_found_in_aad()
        {
            const string UserName = "existingUser";
            var userProfile = new UserProfile { User_name = "existingUser@email.com" };
            var updatedUserResponse = new UpdateUserResponse {New_password = "SomePassword"};
            
            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(UserName))
                .ReturnsAsync(userProfile);

            _userApiClient.Setup(x => x.UpdateUserAsync(UserName)).ReturnsAsync(updatedUserResponse);
            
            var response = await _service.UpdateParticipantPassword(UserName);
            
            response.Should().NotBeNull();
            response.Password.Should().Be(updatedUserResponse.New_password);
            
            _userApiClient.Verify(x => x.UpdateUserAsync(UserName), Times.Once);
        }

        [Test]
        public void Should_throw_exception_on_update_password()
        {
            const string UserName = "existingUser";

            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(UserName))
                .ReturnsAsync((UserProfile) null);


            Assert.ThrowsAsync<UserServiceException>(() => _service.UpdateParticipantPassword(UserName));
        }

        [Test]
        public async Task should_remove_user_in_ad_and_bookings_api()
        {
            var username = "valid.user@test.com";
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(username))
                .ReturnsAsync(new List<HearingsByUsernameForDeletionResponse>());
            
            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(username))
                .ReturnsAsync(new UserProfile { User_role = UserRoleType.Individual.ToString() });

            await _service.DeleteParticipantAccountAsync(username);
            
            _userApiClient.Verify(x => x.DeleteUserAsync(username), Times.Once);
            _bookingsApiClient.Verify(x => x.AnonymisePersonWithUsernameAsync(username), Times.Once);
        }
        
        [Test]
        public async Task should_remove_user_in_ad_but_not_bookings_api()
        {
            var username = "valid.user@test.com";
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(It.IsAny<string>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));
            
            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(username))
                .ReturnsAsync(new UserProfile { User_role = UserRoleType.Individual.ToString() });

            await _service.DeleteParticipantAccountAsync(username);
            
            _userApiClient.Verify(x => x.DeleteUserAsync(username), Times.Once);
            _bookingsApiClient.Verify(x => x.AnonymisePersonWithUsernameAsync(username), Times.Never);
        }
        
        [Test]
        public async Task should_remove_user_in_bookings_api_but_not_ad()
        {
            var username = "valid.user@test.com";
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
            var username = "valid.user@test.com";
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(username))
                .ReturnsAsync(new List<HearingsByUsernameForDeletionResponse>());
            
            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(username))
                .ReturnsAsync(new UserProfile { User_role = UserRoleType.Judge.ToString() });

            var exception = Assert.ThrowsAsync<UserServiceException>(() => _service.DeleteParticipantAccountAsync(username));
            exception.Reason.Should().Be("Unable to delete account with role Judge");
            
            _userApiClient.Verify(x => x.DeleteUserAsync(username), Times.Never);
            _bookingsApiClient.Verify(x => x.AnonymisePersonWithUsernameAsync(username), Times.Never);
        }
        
        [Test]
        public void should_fail_to_delete_admin()
        {
            var username = "valid.user@test.com";
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(username))
                .ReturnsAsync(new List<HearingsByUsernameForDeletionResponse>());
            
            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(username))
                .ReturnsAsync(new UserProfile { User_role = UserRoleType.VhOfficer.ToString() });

            var exception = Assert.ThrowsAsync<UserServiceException>(() => _service.DeleteParticipantAccountAsync(username));
            exception.Reason.Should().Be("Unable to delete account with role VhOfficer");
            
            _userApiClient.Verify(x => x.DeleteUserAsync(username), Times.Never);
            _bookingsApiClient.Verify(x => x.AnonymisePersonWithUsernameAsync(username), Times.Never);
        }
        
        [Test]
        public void should_fail_to_delete_account_when_user_api_throws()
        {
            var username = "valid.user@test.com";
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(username))
                .ReturnsAsync(new List<HearingsByUsernameForDeletionResponse>());
            
            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(username))
                .ThrowsAsync(ClientException.ForUserService(HttpStatusCode.InternalServerError));
            
            Assert.ThrowsAsync<UserAPI.Client.UserServiceException>(() => _service.DeleteParticipantAccountAsync(username));
            
            _userApiClient.Verify(x => x.DeleteUserAsync(username), Times.Never);
            _bookingsApiClient.Verify(x => x.AnonymisePersonWithUsernameAsync(username), Times.Never);
        }
        
        [Test]
        public void should_fail_to_delete_account_when_bookings_api_throws()
        {
            var username = "valid.user@test.com";
            _bookingsApiClient.Setup(x => x.GetHearingsByUsernameForDeletionAsync(username))
                .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));
            
            _userApiClient
                .Setup(x => x.GetUserByAdUserNameAsync(username))
                .ReturnsAsync(new UserProfile { User_role = UserRoleType.Individual.ToString() });
            
            Assert.ThrowsAsync<BookingsApiException>(() => _service.DeleteParticipantAccountAsync(username));
            
            _userApiClient.Verify(x => x.DeleteUserAsync(username), Times.Once);
            _bookingsApiClient.Verify(x => x.AnonymisePersonWithUsernameAsync(username), Times.Never);
        }

        [Test]
        public async Task should_return_user_ad_id_for_username()
        {
            var profile = new UserProfile
            {
                User_id = Guid.NewGuid().ToString()
            };
            _userApiClient.Setup(x => x.GetUserByAdUserIdAsync(It.IsAny<string>()))
                .ReturnsAsync(profile);

            
            var id = await  _service.GetAdUserIdForUsername("do_not_exist@test.com");
            id.Should().Be(profile.User_id);
        }
        
        [Test]
        public async Task should_return_null_when_username_not_found()
        {
            _userApiClient.Setup(x => x.GetUserByAdUserIdAsync(It.IsAny<string>()))
                .Throws(ClientException.ForUserService(HttpStatusCode.NotFound));

            
              var id = await  _service.GetAdUserIdForUsername("do_not_exist@test.com");
              id.Should().BeNull();
        }
        
        [Test]
        public void should_throw_exception_when_username_not_found_throws()
        {
            _userApiClient.Setup(x => x.GetUserByAdUserIdAsync(It.IsAny<string>()))
                .Throws(ClientException.ForUserService(HttpStatusCode.InternalServerError));

            Assert.ThrowsAsync<UserAPI.Client.UserServiceException>(() =>
                _service.GetAdUserIdForUsername("123"));
        }
    }
}