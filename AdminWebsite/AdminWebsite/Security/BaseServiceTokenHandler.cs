using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AdminWebsite.Security
{
    public abstract class BaseServiceTokenHandler : DelegatingHandler
    {
        private readonly AzureAdConfiguration _azureAdConfiguration;
        private readonly IMemoryCache _memoryCache;
        private readonly ITokenProvider _tokenProvider;
        protected readonly ServiceConfiguration ServiceConfiguration;

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

        protected abstract string TokenCacheKey { get; }
        protected abstract string ClientResource { get; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            const string AUTHORIZATION = "Authorization";
            const string BEARER = "Bearer";
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

            return await base.SendAsync(request, cancellationToken);

        }
    }
}