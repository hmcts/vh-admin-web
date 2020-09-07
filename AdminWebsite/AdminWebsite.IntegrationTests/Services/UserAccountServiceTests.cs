using AdminWebsite.Services;
using AdminWebsite.UserAPI.Client;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using AdminWebsite.BookingsAPI.Client;

namespace AdminWebsite.IntegrationTests.Services
{
    public class UserAccountServiceTests
    {
        private Mock<IUserApiClient> _userApiClient;
        private Mock<IBookingsApiClient> _bookingsApiClient;

        [SetUp]
        public void Setup()
        {
            _userApiClient = new Mock<IUserApiClient>();
            _bookingsApiClient = new Mock<IBookingsApiClient>();
        }

        private UserAccountService GetService()
        {
            return new UserAccountService(_userApiClient.Object, _bookingsApiClient.Object);
        }

        [Test]
        public void Should_return_list_of_judges()
        {
            var judgesList = new List<UserResponse>();
            var judge = new UserResponse { Display_name = "john maclain", Email = "john.maclain@email.com", First_name = "john", Last_name = "maclain" };
            judgesList.Add(judge);
            judge = new UserResponse { Display_name = "john wayne", Email = "john.wayne@email.com", First_name = "john", Last_name = "wayne" };
            judgesList.Add(judge);

            _userApiClient.Setup(x => x.GetJudges()).Returns(judgesList);
            var group = GetService().GetJudgeUsers();
            group.Should().NotBeNullOrEmpty();
        }
    }
}