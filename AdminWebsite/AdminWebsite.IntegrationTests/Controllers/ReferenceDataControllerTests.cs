using System.Net;
using System.Text;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Razor.Language;
using NUnit.Framework;
using Testing.Common;

namespace AdminWebsite.IntegrationTests.Controllers
{
    public class ReferenceDataControllerTests : ControllerTestsBase
    {
        private readonly ReferenceEndpoints _referenceEndpoints = new ApiUriFactory().ReferenceEndpoints;

        [Test]
        public async Task should_retrieve_a_list_of_hearing_venues()
        {
            var getResponse = await SendGetRequestAsync(_referenceEndpoints.GetCourts);
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var hearingVenueResponseModel =
                ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingVenueResponse>(getResponse.Content
                    .ReadAsStringAsync().Result);
            hearingVenueResponseModel.Should().NotBeNull();
        }
    }
}