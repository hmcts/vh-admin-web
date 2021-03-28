using AdminWebsite.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AdminWebsite.Security
{
    public class HearingApiTokenHandler : BaseServiceTokenHandler
    {
        public HearingApiTokenHandler(IOptions<AzureAdConfiguration> azureAdConfiguration,
            IOptions<ServiceConfiguration> serviceConfiguration,
            IMemoryCache memoryCache,
            ITokenProvider tokenProvider) : base(
            azureAdConfiguration, serviceConfiguration, memoryCache, tokenProvider)
        {
        }

        protected override string TokenCacheKey => "HearingApiServiceToken";
        protected override string ClientResource => ServiceConfiguration.BookingsApiResourceId;
    }
}