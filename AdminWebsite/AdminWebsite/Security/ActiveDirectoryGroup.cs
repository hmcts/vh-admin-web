using System.Net.Http;
using System.Net.Http.Headers;
using AdminWebsite.Configuration;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;

namespace AdminWebsite.Security
{
    public interface IActiveDirectoryGroup
    {
        string GetGroupDisplayName(string id);
    }

    public class ActiveDirectoryGroup : IActiveDirectoryGroup
    {
        private readonly ITokenProvider _tokenProvider;
        private readonly SecuritySettings _securitySettings;

        public ActiveDirectoryGroup(ITokenProvider tokenProvider, IOptions<SecuritySettings> securitySettings)
        {
            _tokenProvider = tokenProvider;
            _securitySettings = securitySettings.Value;
        }

        public string GetGroupDisplayName(string id)
        {
            var accessToken = _tokenProvider.GetClientAccessToken(_securitySettings.ClientId, _securitySettings.ClientSecret,
                _securitySettings.GraphApiBaseUri);
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var httpRequestMessage =
                    new HttpRequestMessage(HttpMethod.Get, $"{_securitySettings.GraphApiBaseUri}/v1.0/groups/{id}");
                var response = client.SendAsync(httpRequestMessage).Result.Content.ReadAsStringAsync().Result;
                var jObject = JObject.Parse(response);
                return jObject["displayName"].ToString();
            }
        }
    }
}