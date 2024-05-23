using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication;

namespace AdminWebsite.Security.Authentication
{
    public interface IProviderSchemes
    {
        public AuthProvider Provider { get; }

        public string SchemeName { get; }

        public string GetScheme() =>  SchemeName;

        public bool BelongsToScheme(JwtSecurityToken jwtSecurityToken);

        public string[] GetProviderSchemes() => [SchemeName];

        public AuthenticationBuilder AddSchemes(AuthenticationBuilder builder)
        {
            builder = AddScheme(builder);
            return builder;
        }

        public AuthenticationBuilder AddScheme(AuthenticationBuilder builder);
    }
}
