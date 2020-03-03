using AdminWebsite.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AdminWebsite.Security
{
    public class HearingApiTokenHandler : BaseServiceTokenHandler
    {
        private const string TOKEN_CACHE_KEY = "HearingApiServiceToken";

        public HearingApiTokenHandler(IOptions<SecuritySettings> securitySettings,
            IOptions<ServiceSettings> serviceSettings, IMemoryCache memoryCache, ITokenProvider tokenProvider) : base(
            securitySettings, serviceSettings, memoryCache, tokenProvider)
        {
        }

        protected override string TokenCacheKey => TOKEN_CACHE_KEY;
        protected override string ClientResource => ServiceSettings.BookingsApiResourceId;
    }
}
