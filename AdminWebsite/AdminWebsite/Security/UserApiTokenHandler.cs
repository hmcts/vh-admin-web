using AdminWebsite.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AdminWebsite.Security
{
    public class UserApiTokenHandler : BaseServiceTokenHandler
    {
        public UserApiTokenHandler(IOptions<AzureAdConfiguration> azureAdConfiguration,
            IOptions<ServiceConfiguration> serviceSettings,
            IMemoryCache memoryCache,
            ITokenProvider tokenProvider)
            : base(azureAdConfiguration, serviceSettings, memoryCache, tokenProvider)
        {
        }

        protected override string TokenCacheKey => "UserApiServiceToken";
        protected override string ClientResource => ServiceConfiguration.UserApiResourceId;
    }
}