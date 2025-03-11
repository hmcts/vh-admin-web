using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AdminWebsite.Security;

public abstract class BaseServiceTokenHandler(
    IOptions<AzureAdConfiguration> azureAdConfiguration,
    IOptions<ServiceConfiguration> serviceConfiguration,
    IMemoryCache memoryCache,
    ITokenProvider tokenProvider)
    : DelegatingHandler
{
    const string AUTHORIZATION = "Authorization";
    const string BEARER = "Bearer";
    const int MINUTES = -1;

    private readonly AzureAdConfiguration _azureAdConfiguration = azureAdConfiguration.Value;
    protected readonly ServiceConfiguration ServiceConfiguration = serviceConfiguration.Value;

    protected abstract string TokenCacheKey { get; }
    protected abstract string ClientResource { get; }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var token = memoryCache.Get<string>(TokenCacheKey);
        if (string.IsNullOrEmpty(token))
        {
            var authenticationResult = await tokenProvider.GetAuthorisationResult(_azureAdConfiguration.ClientId, _azureAdConfiguration.ClientSecret, ClientResource);
            token = authenticationResult.AccessToken;
            var tokenExpireDateTime = authenticationResult.ExpiresOn.DateTime.AddMinutes(MINUTES);
            memoryCache.Set(TokenCacheKey, token, tokenExpireDateTime);
        }

        request.Headers.Add(AUTHORIZATION, $"{BEARER} {token}");

        return await base.SendAsync(request, cancellationToken);
    }
}