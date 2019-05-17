using AdminWebsite.Services;
using AdminWebsite.UserAPI.Client;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using UserServiceException = AdminWebsite.Security.UserServiceException;

namespace AdminWebsite.IntegrationTests.Services
{
    public class UserAccountServiceTests
    {
        private Mock<IUserApiClient> _apiClient;

        [SetUp]
        public void Setup()
        {
            _apiClient = new Mock<IUserApiClient>();
        }

        private UserAccountService GetService()
        {
            return new UserAccountService(_apiClient.Object);
        }

        [Test]
        public void should_return_null_if_getting_group_name_of_group_that_cant_be_found()
        {
            const string invalidGroupId = "5F750C75-D771-44F5-8EF8-F194C6545F7A";
            var group = GetService().GetGroupById(invalidGroupId);
            group.Should().BeNull();
        }

        [Test]
        public void should_return_group_with_display_name_by_id()
        {
            GroupsResponse groupResponse = new GroupsResponse() { Display_name = "VirtualRoomProfessionalUser", Group_id = "f3340a0e-2ea2-45c6-b19c-d601b8dac13f" };
            _apiClient.Setup(x => x.GetGroupById("f3340a0e-2ea2-45c6-b19c-d601b8dac13f")).Returns(groupResponse);
            var group = GetService().GetGroupById("f3340a0e-2ea2-45c6-b19c-d601b8dac13f");
            group.Display_name.Should().Be("VirtualRoomProfessionalUser");
        }

        [Test]
        public void should_return_list_of_judges()
        {
            var judgesList = new List<UserResponse>();
            var judge = new UserResponse { Display_name = "john maclain", Email = "john.maclain@email.com", First_name = "john", Last_name = "maclain" };
            judgesList.Add(judge);
            judge = new UserResponse { Display_name = "john wayne", Email = "john.wayne@email.com", First_name = "john", Last_name = "wayne" };
            judgesList.Add(judge);

            _apiClient.Setup(x => x.GetJudges()).Returns(judgesList);
            var group = GetService().GetJudgeUsers();
            group.Should().NotBeNullOrEmpty();
        }

        [Test]
        public void should_throw_exception_on_invalid_server_response_for_group_by_id()
        {
            _apiClient.Setup(x => x.GetGroupById(It.IsAny<string>())).Throws(new UserServiceException());
            Assert.Throws<UserServiceException>(() => GetService().GetGroupById("not a valid id"));
        }
    }
}