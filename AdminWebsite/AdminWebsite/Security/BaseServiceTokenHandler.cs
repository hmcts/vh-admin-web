using AdminWebsite.Configuration;
using AdminWebsite.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace AdminWebsite.Security
{
    public abstract class BaseServiceTokenHandler : DelegatingHandler
    {
        private readonly ITokenProvider _tokenProvider;
        private readonly IMemoryCache _memoryCache;
        private readonly SecuritySettings _securitySettings;
        protected readonly ServiceSettings ServiceSettings;

        protected abstract string TokenCacheKey { get; }
        protected abstract string ClientResource { get; }

        protected BaseServiceTokenHandler(IOptions<SecuritySettings> securitySettings,
            IOptions<ServiceSettings> serviceSettings,
            IMemoryCache memoryCache,
            ITokenProvider tokenProvider)
        {
            _securitySettings = securitySettings.Value;
            ServiceSettings = serviceSettings.Value;
            _memoryCache = memoryCache;
            _tokenProvider = tokenProvider;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            const string AUTHORIZATION = "Authorization";
            const string BEARER = "Bearer";
            const string ERR_MSG = "Client Exception";
            const int MINUTES = -1;

            var properties = new Dictionary<string, string>();

            var token = _memoryCache.Get<string>(TokenCacheKey);
            if (string.IsNullOrEmpty(token))
            {
                var authenticationResult = _tokenProvider.GetAuthorisationResult(_securitySettings.ClientId, _securitySettings.ClientSecret, ClientResource);
                token = authenticationResult.AccessToken;
                var tokenExpireDateTime = authenticationResult.ExpiresOn.DateTime.AddMinutes(MINUTES);
                _memoryCache.Set(TokenCacheKey, token, tokenExpireDateTime);
            }

            request.Headers.Add(AUTHORIZATION, $"{BEARER} {token}");
            try
            {
                return await base.SendAsync(request, cancellationToken);
            }
            catch (Exception e)
            {
                ApplicationLogger.TraceException(TraceCategory.ServiceAuthentication.ToString(), ERR_MSG, e, null, properties);
                
                throw;
            }
        }
    }
}