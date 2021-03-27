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

            var resonpseString = await getResponse.Content.ReadAsStringAsync();
            var clientSettingsResponseModel = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ClientSettingsResponse>(resonpseString);
            clientSettingsResponseModel.Should().NotBeNull();
            clientSettingsResponseModel.ClientId.Should().NotBeNull();
            clientSettingsResponseModel.TenantId.Should().NotBeNull();
            clientSettingsResponseModel.RedirectUri.Should().NotBeNull();
            clientSettingsResponseModel.TestUsernameStem.Should().NotBeNullOrEmpty();
            clientSettingsResponseModel.TestUsernameStem.Length.Should().Be(26);
        }
    }
}