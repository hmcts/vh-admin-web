using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Services;
using AdminWebsite.UserAPI.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using Testing.Common;

namespace AdminWebsite.IntegrationTests.Controllers.UserDataController
{
    public class GetJudgesTests : ControllerTestsBase
    {
        private Mock<IUserApiClient> _apiClient;

        [Test]
        public void should_return_a_list_of_judges()
        {
            var judgeResponse = SetupData();
            userAccountService.Setup(x => x.GetJudgeUsers()).Returns(judgeResponse);

            var _controller = new AdminWebsite.Controllers.UserDataController(userAccountService.Object);
            var result = _controller.GetJudges().Result;
            var okObjectResult = (OkObjectResult)result;
            okObjectResult.StatusCode.Should().Be(200);

            var judges = (List<JudgeResponse>)okObjectResult.Value;
            var testJudge = judges.Single(j =>
                j.Email.Equals("Test.Judge01@hearings.reform.hmcts.net", StringComparison.CurrentCultureIgnoreCase));

            testJudge.LastName.Should().Be("Judge01");
            testJudge.FirstName.Should().Be("Test");
            testJudge.DisplayName.Should().Be("Test Judge01");
        }

        private List<JudgeResponse> SetupData()
        {
            _apiClient = new Mock<IUserApiClient>();
            GroupsResponse groupResponse = new GroupsResponse() { Display_name = "VirtualRoomJudge", Group_id = "431f50b2-fb30-4937-9e91-9b9eeb54097f" };
            _apiClient.Setup(x => x.GetGroupByName("VirtualRoomJudge")).Returns(groupResponse);

            GroupsResponse groupResponseTest = new GroupsResponse() { Display_name = "TestAccount", Group_id = "63b60a06-874f-490d-8acb-56a88a125078" };
            _apiClient.Setup(x => x.GetGroupByName("TestAccount")).Returns(groupResponseTest);

            List<JudgeResponse> judgeResponse = new List<JudgeResponse>();
            var judgeData = new JudgeResponse()
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
            return judgeResponse;
        }
    }
}