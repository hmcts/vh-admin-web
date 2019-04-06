using AdminWebsite.Contracts.Responses;
using FluentAssertions;
using NUnit.Framework;
using System.Net;
using System.Threading.Tasks;
using Testing.Common;

namespace AdminWebsite.IntegrationTests.Controllers
{
    public class ConfigSettingsControllerTests : ControllerTestsBase
    {
        private readonly ConfigSettingsEndpoints _configSettingsEndpoints = new ApiUriFactory().ConfigSettingsEndpoints;

        [Test]
        public async Task should_retrieve_the_client_config_settings()
        {
            var getResponse = await SendGetRequestAsync(_configSettingsEndpoints.GetConfigSettings);
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var clientSettingsResponseModel =
                ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ClientSettingsResponse>(getResponse.Content
                    .ReadAsStringAsync().Result);
            clientSettingsResponseModel.Should().NotBeNull();
            clientSettingsResponseModel.ClientId.Should().Be("d83f8336-3d59-49b6-8e2c-efcdc6ecd4f3");
            clientSettingsResponseModel.TenantId.Should().NotBeNull();
            clientSettingsResponseModel.RedirectUri.Should().NotBeNull();
        }
    }
}