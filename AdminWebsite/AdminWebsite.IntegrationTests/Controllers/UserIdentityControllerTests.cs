using AdminWebsite.Contracts.Responses;
using FluentAssertions;
using NUnit.Framework;
using System.Net;
using System.Threading.Tasks;
using Testing.Common;

namespace AdminWebsite.IntegrationTests.Controllers
{
    public class UserIdentityControllerTests : ControllerTestsBase
    {
        private readonly UserIdentityEndpoints _userIdentityEndpoints = new ApiUriFactory().UserIdentityEndpoints;

        [Test]
        public async Task should_retrieve_the_user_profile_name()
        {
            var getResponse = await SendGetRequestAsync(_userIdentityEndpoints.GetUserProfile);
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var userProfileResponseModel =
                ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<UserProfileResponse>(getResponse.Content
                    .ReadAsStringAsync().Result);
            userProfileResponseModel.Should().NotBeNull();
        }
    }
}