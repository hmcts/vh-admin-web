using AdminWebsite.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AdminWebsite.Security
{
    public class NotificationApiTokenHandler : BaseServiceTokenHandler
    {
        public NotificationApiTokenHandler(IOptions<AzureAdConfiguration> azureAdConfiguration,
            IOptions<ServiceConfiguration> serviceConfiguration,
            IMemoryCache memoryCache,
            ITokenProvider tokenProvider) : base(
            azureAdConfiguration, serviceConfiguration, memoryCache, tokenProvider)
        {
        }

        protected override string TokenCacheKey => "NotificationApiServiceToken";
        protected override string ClientResource => ServiceConfiguration.NotificationApiResourceId;
    }
}