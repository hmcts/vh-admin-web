using AdminWebsite.Contracts.Responses;
using AdminWebsite.Controllers;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using AdminWebsite.UserAPI.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;

namespace AdminWebsite.UnitTests.Controllers
{
    public class UserDataControllerTests
    {
        private UserDataController _controller;
        private Mock<IUserApiClient> _apiClient;
        protected Mock<IUserAccountService> _userAccountService { get; private set; }

        private readonly List<JudgeResponse> judgeResponse = new List<JudgeResponse>();

        [SetUp]
        public void Setup()
        {
            _userAccountService = new Mock<IUserAccountService>();
            _controller = new UserDataController(_userAccountService.Object);

            _apiClient = new Mock<IUserApiClient>();
            GroupsResponse groupResponse = new GroupsResponse() { Display_name = "VirtualRoomJudge", Group_id = "431f50b2-fb30-4937-9e91-9b9eeb54097f" };
            _apiClient.Setup(x => x.GetGroupByName("VirtualRoomJudge")).Returns(groupResponse);

            GroupsResponse groupResponseTest = new GroupsResponse() { Display_name = "TestAccount", Group_id = "63b60a06-874f-490d-8acb-56a88a125078" };
            _apiClient.Setup(x => x.GetGroupByName("TestAccount")).Returns(groupResponseTest);

            JudgeResponse judgeData = new JudgeResponse()
            {
                Email = "Test.Judge01@hearings.reform.hmcts.net",
                DisplayName = "Test Judge01",
                FirstName = "Test",
                LastName = "Judge01"
            };
            judgeResponse.Add(judgeData);
            judgeData = new JudgeResponse()
            {
                Email = "Test.Judge02@hearings.reform.hmcts.net",
                DisplayName = "Test Judge02",
                FirstName = "Test",
                LastName = "Judge021"
            };
            judgeResponse.Add(judgeData);
        }

        [Test]
        public void should_return_a_list_of_judges()
        {
            _userAccountService.Setup(x => x.GetJudgeUsers()).Returns(judgeResponse);

            _controller = new UserDataController(_userAccountService.Object);
            ActionResult result = _controller.GetJudges().Result;
            OkObjectResult okObjectResult = (OkObjectResult)result;
            okObjectResult.StatusCode.Should().Be(200);

            List<JudgeResponse> judges = (List<JudgeResponse>)okObjectResult.Value;
            JudgeResponse testJudge = judges.Single(j =>
                j.Email.Equals("Test.Judge01@hearings.reform.hmcts.net", StringComparison.CurrentCultureIgnoreCase));

            testJudge.LastName.Should().Be("Judge01");
            testJudge.FirstName.Should().Be("Test");
            testJudge.DisplayName.Should().Be("Test Judge01");
        }

        [Test]
        public void user_controller_should_return_a_bad_request_when_no_username_is_passed()
        {
            _userAccountService.Setup(x => x.UpdateParticipantPassword(It.IsAny<string>())).ThrowsAsync(ClientException.ForUserService(HttpStatusCode.BadRequest));
            var response = _controller.UpdateUser("");
            response.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public void user_controller_should_return_a_not_found_when_invalid_username_is_passed()
        {
            _userAccountService.Setup(x => x.UpdateParticipantPassword(It.IsAny<string>())).ThrowsAsync(ClientException.ForUserService(HttpStatusCode.NotFound));
            var response = _controller.UpdateUser("unknown.user@domain.com");
            response.Result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Test]
        public void user_controller_should_return_no_content_when_valid_username_is_passed()
        {
            _controller = new UserDataController(_userAccountService.Object);
            ActionResult result = _controller.UpdateUser("test").Result;
            NoContentResult noContentResult = (NoContentResult)result;
            noContentResult.StatusCode.Should().Be(204);
        }
    }
}
