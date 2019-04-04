using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using FluentAssertions;
using NUnit.Framework;
using Testing.Common;

namespace AdminWebsite.IntegrationTests.Controllers.UserDataController
{
    public class GetJudgesTests : ControllerTestsBase
    {
        [Test]
        public async Task should_return_a_list_of_judges()
        {
            var responseMessage = await SendGetRequestAsync("/api/accounts/judges");
            responseMessage.StatusCode.Should().Be(HttpStatusCode.OK);
            var resultJson = await responseMessage.Content.ReadAsStringAsync();
            var judges = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<JudgeResponse[]>(resultJson);

            var testJudge = judges.Single(j =>
                j.Email.Equals("Test.Judge01@hearings.reform.hmcts.net", StringComparison.CurrentCultureIgnoreCase));

            testJudge.LastName.Should().Be("Judge01");
            testJudge.FirstName.Should().Be("Test");
            testJudge.DisplayName.Should().Be("Test Judge01");
        }
    }
}