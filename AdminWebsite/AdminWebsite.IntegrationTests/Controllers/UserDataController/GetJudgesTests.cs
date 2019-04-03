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
            var judges = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ParticipantDetailsResponse[]>(resultJson);

            var testJudge = judges.Single(j =>
                j.Email.Equals("Test.Judge01@hearings.reform.hmcts.net", StringComparison.CurrentCultureIgnoreCase));

            Guid.TryParse(testJudge.Id, out _).Should().BeTrue();
            testJudge.LastName.Should().Be("Judge01");
            testJudge.FirstName.Should().Be("Test");
            testJudge.DisplayName.Should().Be("Test Judge01");
            
            // These aren't part of the active directory data, really, they should not be a part of the result
            testJudge.MiddleName.Should().Be("");
            testJudge.Role.Should().BeNull();
            testJudge.Title.Should().BeNull();
            testJudge.Phone.Should().BeNull();
        }
    }
}