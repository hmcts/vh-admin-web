using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using FluentAssertions;
using Newtonsoft.Json;
using NUnit.Framework;

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
            var judges = JsonConvert.DeserializeObject<ParticipantDetailsResponse[]>(resultJson);
            judges.Length.Should().BeGreaterThan(0);
        }
    }
}