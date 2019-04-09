using AdminWebsite.BookingsAPI.Client;
using FluentAssertions;
using NUnit.Framework;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Testing.Common;

namespace AdminWebsite.IntegrationTests.Controllers
{
    public class PersonsControllerTests : ControllerTestsBase
    {
        [Ignore("Api is not ready")]
        [Test]
        public async Task should_return_a_list_of_person_matching_search_term()
        {
            var responseMessage = await SendGetRequestAsync("/api/persons/search/ado");
            responseMessage.StatusCode.Should().Be(HttpStatusCode.OK);
            var resultJson = await responseMessage.Content.ReadAsStringAsync();
            var persons = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<PersonResponse[]>(resultJson);

            if (persons.Any())
            {
                var result = persons.All(x => x.Contact_email.StartsWith("ado"));
                result.Should().BeTrue();
            }
            else
            {
                persons.Count().Should().Be(0);
            }
        }
    }
}
