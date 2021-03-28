using AdminWebsite.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using System;
using System.Threading.Tasks;

namespace AdminWebsite.Security
{
    public interface ITokenProvider
    {
        Task<string> GetClientAccessToken(string clientId, string clientSecret, string clientResource);
        Task<AuthenticationResult> GetAuthorisationResult(string clientId, string clientSecret, string clientResource);
    }

    public class TokenProvider : ITokenProvider
    {
        private readonly AzureAdConfiguration _azureAdConfiguration;

        public TokenProvider(IOptions<AzureAdConfiguration> azureAdConfiguration)
        {
            _azureAdConfiguration = azureAdConfiguration.Value;
        }

        public async Task<string> GetClientAccessToken(string clientId, string clientSecret, string clientResource)
        {
            var result = await GetAuthorisationResult(clientId, clientSecret, clientResource);
            return result.AccessToken;
        }

        public async Task<AuthenticationResult> GetAuthorisationResult(string clientId, string clientSecret, string clientResource)
        {
            var credential = new ClientCredential(clientId, clientSecret);
            var authContext = new AuthenticationContext($"{_azureAdConfiguration.Authority}{_azureAdConfiguration.TenantId}");
            try
            {
                return await authContext.AcquireTokenAsync(clientResource, credential);
            }
            catch (AdalException)
            {
                throw new UnauthorizedAccessException();
            }
        }
    }
}
