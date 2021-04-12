using AdminWebsite.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AdminWebsite.Security
{
    public class VideoApiTokenHandler : BaseServiceTokenHandler
    {
        public VideoApiTokenHandler(IOptions<AzureAdConfiguration> azureAdConfiguration,
            IOptions<ServiceConfiguration> serviceConfiguration,
            IMemoryCache memoryCache,
            ITokenProvider tokenProvider) : base(
            azureAdConfiguration, serviceConfiguration, memoryCache, tokenProvider)
        {
        }

        protected override string TokenCacheKey => "VideoApiServiceToken";
        protected override string ClientResource => ServiceConfiguration.VideoApiResourceId;
    }
}