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
        private readonly AzureAdConfiguration _azureAdConfiguration;
        protected readonly ServiceConfiguration ServiceConfiguration;

        protected abstract string TokenCacheKey { get; }
        protected abstract string ClientResource { get; }

        protected BaseServiceTokenHandler(IOptions<AzureAdConfiguration> azureAdConfiguration,
            IOptions<ServiceConfiguration> serviceConfiguration,
            IMemoryCache memoryCache,
            ITokenProvider tokenProvider)
        {
            _azureAdConfiguration = azureAdConfiguration.Value;
            ServiceConfiguration = serviceConfiguration.Value;
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
                var authenticationResult = await _tokenProvider.GetAuthorisationResult(_azureAdConfiguration.ClientId, _azureAdConfiguration.ClientSecret, ClientResource);
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