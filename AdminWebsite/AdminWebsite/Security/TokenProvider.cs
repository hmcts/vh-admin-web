using System;
using AdminWebsite.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Clients.ActiveDirectory;

namespace AdminWebsite.Security
{
    public interface ITokenProvider
    {
        string GetClientAccessToken(string clientId, string clientSecret, string clientResource);
        AuthenticationResult GetAuthorisationResult(string clientId, string clientSecret, string clientResource);
    }

    public class TokenProvider : ITokenProvider
    {
        private readonly SecuritySettings _securitySettings;

        public TokenProvider(IOptions<SecuritySettings> environmentConfiguration)
        {
            _securitySettings = environmentConfiguration.Value;
        }

        public string GetClientAccessToken(string clientId, string clientSecret, string clientResource)
        {
            var result = GetAuthorisationResult(clientId, clientSecret, clientResource);
            return result.AccessToken;
        }

        public AuthenticationResult GetAuthorisationResult(string clientId, string clientSecret, string clientResource)
        {
            if (string.IsNullOrEmpty(clientId)) throw new ArgumentNullException(clientId, nameof(clientId));
            if (string.IsNullOrEmpty(clientSecret)) throw new ArgumentNullException(clientSecret, nameof(clientSecret));
            if (string.IsNullOrEmpty(clientResource)) throw new ArgumentNullException(clientResource, nameof(clientResource));

            var credential = new ClientCredential(clientId, clientSecret);
            var authContext = new AuthenticationContext($"{_securitySettings.Authority}");

            try
            {
                return authContext.AcquireTokenAsync(clientResource, credential).Result;
            }
            catch (AggregateException e)
            {
                if (e.InnerException is AdalException adalException)
                {
                    throw new UnauthorizedAccessException($"Not authorized to access service {clientResource}, please verify client and resource settings", adalException);
                }

                throw;
            }
        }
    }
}
