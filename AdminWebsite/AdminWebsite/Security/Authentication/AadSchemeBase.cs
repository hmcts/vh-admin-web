using System;
using System.IdentityModel.Tokens.Jwt;
using AdminWebsite.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace AdminWebsite.Security.Authentication
{
    public abstract class AadSchemeBase : ProviderSchemeBase, IProviderSchemes
    {
        protected readonly IdpConfiguration _idpConfiguration;
        
        protected AadSchemeBase(IdpConfiguration idpConfiguration)
        {
            _idpConfiguration = idpConfiguration;
        }

        public bool BelongsToScheme(JwtSecurityToken jwtSecurityToken) => jwtSecurityToken.Issuer.Contains(_idpConfiguration.TenantId, StringComparison.InvariantCultureIgnoreCase);

        public override void SetJwtBearerOptions(JwtBearerOptions options)
        {
            options.Authority = $"{_idpConfiguration.Authority}{_idpConfiguration.TenantId}/v2.0";
            options.Audience = _idpConfiguration.ClientId;
            options.TokenValidationParameters.NameClaimType = "preferred_username";
            options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
            options.TokenValidationParameters.ValidateLifetime = true;
        }
    }
}
