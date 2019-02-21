using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Services;
using FluentAssertions;
using Microsoft.Graph;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Services
{
    public class UserManagerTests
    {
        private Mock<IUserAccountService> _userAccountServiceMock;
        private UserManager _userManager;

        [SetUp]
        public void Setup()
        {
            _userAccountServiceMock = new Mock<IUserAccountService>();

            _userAccountServiceMock.Setup(x => x.GetGroupByName("SSPR Enabled")).Returns(new Group
                {Id = Guid.NewGuid().ToString(), DisplayName = "SSPR Enabled"});
            
            _userAccountServiceMock.Setup(x => x.GetGroupByName("Participant")).Returns(new Group
                {Id = Guid.NewGuid().ToString(), DisplayName = "Participant"});
            
            _userAccountServiceMock.Setup(x => x.GetGroupByName("External")).Returns(new Group
                {Id = Guid.NewGuid().ToString(), DisplayName = "External"});
            
            _userAccountServiceMock.Setup(x => x.GetGroupByName("Internal")).Returns(new Group
                {Id = Guid.NewGuid().ToString(), DisplayName = "Internal"});
            
            _userAccountServiceMock.Setup(x => x.GetGroupByName("VirtualRoomProfessionalUser")).Returns(new Group
                {Id = Guid.NewGuid().ToString(), DisplayName = "VirtualRoomProfessionalUser"});
            
            _userAccountServiceMock.Setup(x => x.GetGroupByName("VirtualRoomJudge")).Returns(new Group
                {Id = Guid.NewGuid().ToString(), DisplayName = "VirtualRoomJudge"});
            
            _userAccountServiceMock.Setup(x => x.GetGroupByName("VirtualRoomHearingAdministrator")).Returns(new Group
                {Id = Guid.NewGuid().ToString(), DisplayName = "VirtualRoomHearingAdministrator"});
            
            _userAccountServiceMock.Setup(x => x.GetGroupByName("VirtualRoomClerk")).Returns(new Group
                {Id = Guid.NewGuid().ToString(), DisplayName = "VirtualRoomClerk"});
            
            _userManager = new UserManager(_userAccountServiceMock.Object);
        }

        [TestCase("Citizen")]
        [TestCase("Professional")]
        [TestCase("Judge")]
        [TestCase("Administrator")]
        [TestCase("Clerk")]
        public void should_get_groups_for_roles(string role)
        {
            var result = _userManager.GetGroupsForRole(role).ToList();
            result.Should().NotBeEmpty();
            result.Count.Should().BeGreaterThan(1);
        }
        
        [Test]
        public void should_add_user_to_groups_they_do_not_belong_to()
        {
            var userId = Guid.NewGuid().ToString();
            var role = "Citizen";

            var existingGroups = new List<Group>
            {
                new Group {DisplayName = "External"}
            };
            _userAccountServiceMock.Setup(x => x.GetGroupsForUser(userId)).Returns(existingGroups);
            
            _userManager.AddToGroups(userId, role);

           _userAccountServiceMock.Verify(x => x.AddUserToGroup(It.IsAny<User>(), It.IsAny<Group>()),
               Times.Once);
        }

        [Test]
        public void should_append_number_to_username_if_username_already_exists()
        {
            var existingUsername1 = "test.user@hearings.reform.hmcts.net";
            var existingUsers = new List<User>
            {
                new User {UserPrincipalName = existingUsername1},
            };
            _userAccountServiceMock.Setup(x => x.QueryUsers(It.IsAny<string>()))
                .Returns(existingUsers);
            
            var result = _userManager.CheckForNextAvailableUsername("test", "user");

            result.Should().Be("test.user1@hearings.reform.hmcts.net");
        }
        
        public void should_append_number_to_username_if_multiple_usernames_already_exists()
        {
            var existingUsername1 = "test.user@hearings.reform.hmcts.net";
            var existingUsername2 = "test.user1@hearings.reform.hmcts.net";
            var existingUsername3 = "test.user2@hearings.reform.hmcts.net";
            var existingUsername4 = "test.user3@hearings.reform.hmcts.net";
            var existingUsers = new List<User>
            {
                new User {UserPrincipalName = existingUsername3},
                new User {UserPrincipalName = existingUsername1},
                new User {UserPrincipalName = existingUsername4},
                new User {UserPrincipalName = existingUsername2},
            };
            _userAccountServiceMock.Setup(x => x.QueryUsers(It.IsAny<string>()))
                .Returns(existingUsers);
            
            var result = _userManager.CheckForNextAvailableUsername("test", "user");

            result.Should().Be("test.user4@hearings.reform.hmcts.net");
        }
        
        [Test]
        public void should_not_append_number_to_username_if_username_does_not_exists()
        {
            var existingUsers = new List<User>();
            _userAccountServiceMock.Setup(x => x.QueryUsers(It.IsAny<string>()))
                .Returns(existingUsers);
            
            var result = _userManager.CheckForNextAvailableUsername("test", "user");

            result.Should().Be("test.user@hearings.reform.hmcts.net");
        }
    }
}
