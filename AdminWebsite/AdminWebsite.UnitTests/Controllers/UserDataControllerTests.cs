using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Controllers;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using Microsoft.AspNetCore.Mvc;

namespace AdminWebsite.UnitTests.Controllers;

public class UserDataControllerTests
{
    private readonly List<JudgeResponse> _judgeResponse = new();
    private UserDataController _controller;
    private Mock<IUserAccountService> _userAccountService;

    [SetUp]
    public void Setup()
    {
        _userAccountService = new Mock<IUserAccountService>();
        _controller = new UserDataController(_userAccountService.Object);

        var judgeData = new JudgeResponse()
        {
            Email = "Test.Judge01@hmcts.net",
            DisplayName = "Test Judge01",
            FirstName = "Test",
            LastName = "Judge01",
            ContactEmail = "judge@personal.com"
        };
        _judgeResponse.Add(judgeData);
        judgeData = new JudgeResponse()
        {
            Email = "Test.Judge02@hmcts.net",
            DisplayName = "Test Judge02",
            FirstName = "Test",
            LastName = "Judge021",
            ContactEmail = "judge2@personal.com"
        };
        _judgeResponse.Add(judgeData);
    }

    [Test]
    public void Should_return_a_list_of_judges_with_correct_search_term()
    {
        var term = "SearchTerm";
        _userAccountService.Setup(x => x.SearchJudgesByEmail(term)).ReturnsAsync(_judgeResponse);

        _controller = new UserDataController(_userAccountService.Object);
        var result = _controller.SearchJudgesByEmail(term).Result;
        var okObjectResult = (OkObjectResult)result.Result;
        okObjectResult.StatusCode.Should().Be(200);

        var judges = (List<JudgeResponse>)okObjectResult.Value;

        var testJudge = judges.First(j =>
            j.Email.Equals("Test.Judge01@hmcts.net", StringComparison.CurrentCultureIgnoreCase));

        testJudge.LastName.Should().Be("Judge01");
        testJudge.FirstName.Should().Be("Test");
        testJudge.DisplayName.Should().Be("Test Judge01");
        testJudge.ContactEmail.Should().Be("judge@personal.com");
    }

    [Test]
    public void Should_return_a_bad_request_when_no_username_is_passed()
    {
        _userAccountService.Setup(x => x.ResetParticipantPassword(It.IsAny<string>()))
            .ThrowsAsync(ClientException.ForUserService(HttpStatusCode.BadRequest));
        var response = _controller.ResetPassword("");
        response.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Test]
    public void Should_return_a_not_found_when_invalid_username_is_passed()
    {
        _userAccountService.Setup(x => x.ResetParticipantPassword(It.IsAny<string>()))
            .ThrowsAsync(ClientException.ForUserService(HttpStatusCode.NotFound));
        var response = _controller.ResetPassword("unknown.user@hmcts.net");
        response.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Test]
    public async Task Should_return_no_content_when_valid_username_is_passed()
    {
        _controller = new UserDataController(_userAccountService.Object);
        var response = await _controller.ResetPassword("test");
        var result = response as OkResult;
        result.Should().NotBeNull();
        result.StatusCode.Should().Be(200);
    }
}