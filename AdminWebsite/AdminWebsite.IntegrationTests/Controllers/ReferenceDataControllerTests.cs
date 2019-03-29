using System.Net;
using System.Text;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
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

        [Test]
        public async Task should_retrieve_a_list_of_hearing_types()
        {
            var getResponse = await SendGetRequestAsync(_referenceEndpoints.GetHearingTypes);
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var hearingTypeResponseModel =
                ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingTypeResponse>(getResponse.Content
                    .ReadAsStringAsync().Result);
            hearingTypeResponseModel.Should().NotBeNull();
        }

        [Test]
        public async Task should_retrieve_a_list_of_case_and_hearing_roles()
        {
            var getResponse = await SendGetRequestAsync(_referenceEndpoints.GetParticipantRoles);
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var caseHearingRolesResponseModel =
                ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<CaseAndHearingRolesResponse>(getResponse.Content
                    .ReadAsStringAsync().Result);
            caseHearingRolesResponseModel.Should().NotBeNull();
        }
    }
}