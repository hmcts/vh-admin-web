using AdminWebsite.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AdminWebsite.Security
{
    /// <summary>
    ///     The User API Token handler class.
    /// </summary>
    public class UserApiTokenHandler : BaseServiceTokenHandler
    {
        private const string TOKEN_CACHE_KEY = "UserApiServiceToken";

        /// <summary>
        ///     User API token handler.
        /// </summary>
        /// <param name="securitySettings"></param>
        /// <param name="serviceSettings"></param>
        /// <param name="memoryCache"></param>
        /// <param name="tokenProvider"></param>
        public UserApiTokenHandler(IOptions<SecuritySettings> securitySettings,
            IOptions<ServiceSettings> serviceSettings, IMemoryCache memoryCache,
            ITokenProvider tokenProvider)
            : base(securitySettings, serviceSettings, memoryCache, tokenProvider)
        {
        }

        /// <summary>
        ///     The User API token cache.
        /// </summary>
        protected override string TokenCacheKey => TOKEN_CACHE_KEY;

        /// <summary>
        ///     The User API resource Id.
        /// </summary>
        protected override string ClientResource => ServiceSettings.UserApiResourceId;
    }
}
