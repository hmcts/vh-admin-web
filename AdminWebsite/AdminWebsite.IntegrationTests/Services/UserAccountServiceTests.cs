using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Services;
using BookingsApi.Client;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using NotificationApi.Client;
using UserApi.Client;
using UserApi.Contract.Responses;

namespace AdminWebsite.IntegrationTests.Services;

public class UserAccountServiceTests
{
    private Mock<IBookingsApiClient> _bookingsApiClient;
    private Mock<ILogger<UserAccountService>> _logger;
    private Mock<INotificationApiClient> _notificationApiClient;
    private Mock<IUserApiClient> _userApiClient;
    private List<UserResponse> judgesList;

    [SetUp]
    public void Setup()
    {
        _userApiClient = new Mock<IUserApiClient>();
        _notificationApiClient = new Mock<INotificationApiClient>();
        _bookingsApiClient = new Mock<IBookingsApiClient>();
        _logger = new Mock<ILogger<UserAccountService>>();

        judgesList = new List<UserResponse>();
        var judge = new UserResponse { DisplayName = "john maclain", Email = "john.maclain@hmcts.net", FirstName = "john", LastName = "maclain" };
        judgesList.Add(judge);
        judge = new UserResponse { DisplayName = "john wayne", Email = "john.wayne@hmcts.net", FirstName = "john", LastName = "wayne" };
        judgesList.Add(judge);

    }

    private UserAccountService GetService()
    {
        return new UserAccountService(_userApiClient.Object, _bookingsApiClient.Object,
            _notificationApiClient.Object, _logger.Object);
    }

    [Test]
    [TestCase("john", 2)]
    [TestCase("john.m", 1)]
    public async Task SearchJudgesByEmail_Should_return_list_of_judges_by_search_term(string term, int expectedToMatchCount)
    {
        _userApiClient.Setup(x => x.GetJudgesByUsernameAsync(term)).ReturnsAsync(judgesList.Where(x => x.Email.Contains(term)).ToList());
        var group = await GetService().SearchJudgesByEmail(term);
        group.Should().HaveCount(expectedToMatchCount);
    }
}