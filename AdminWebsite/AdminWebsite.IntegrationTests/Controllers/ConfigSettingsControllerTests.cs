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
        public async Task Should_retrieve_the_client_config_settings()
        {
            var getResponse = await SendGetRequestAsync(_configSettingsEndpoints.GetConfigSettings);
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var clientSettingsResponseModel =
                ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ClientSettingsResponse>(getResponse.Content
                    .ReadAsStringAsync().Result);
            clientSettingsResponseModel.Should().NotBeNull();
            clientSettingsResponseModel.ClientId.Should().NotBeNull();
            clientSettingsResponseModel.TenantId.Should().NotBeNull();
            clientSettingsResponseModel.RedirectUri.Should().NotBeNull();
            clientSettingsResponseModel.TestUserStem.Should().NotBeNullOrEmpty();
            clientSettingsResponseModel.TestUserStem.Length.Should().Be(26);

        }
    }
}