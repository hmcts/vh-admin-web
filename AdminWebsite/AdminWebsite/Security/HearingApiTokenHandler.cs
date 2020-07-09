using AdminWebsite.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AdminWebsite.Security
{
    public class HearingApiTokenHandler : BaseServiceTokenHandler
    {
        public HearingApiTokenHandler(IOptions<SecuritySettings> securitySettings,
            IOptions<ServiceSettings> serviceSettings,
            IMemoryCache memoryCache,
            ITokenProvider tokenProvider) : base(
            securitySettings, serviceSettings, memoryCache, tokenProvider)
        {
        }

        protected override string TokenCacheKey => "HearingApiServiceToken";
        protected override string ClientResource => ServiceSettings.BookingsApiResourceId;
    }
}