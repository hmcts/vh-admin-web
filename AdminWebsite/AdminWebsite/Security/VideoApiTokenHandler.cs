using AdminWebsite.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AdminWebsite.Security
{
    public class VideoApiTokenHandler : BaseServiceTokenHandler
    {
        public VideoApiTokenHandler(IOptions<SecuritySettings> securitySettings,
            IOptions<ServiceSettings> serviceSettings,
            IMemoryCache memoryCache,
            ITokenProvider tokenProvider) : base(
            securitySettings, serviceSettings, memoryCache, tokenProvider)
        {
        }

        protected override string TokenCacheKey => "VideoApiServiceToken";
        protected override string ClientResource => ServiceSettings.VideoApiResourceId;
    }
}