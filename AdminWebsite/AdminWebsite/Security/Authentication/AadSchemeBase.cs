using System;
using System.IdentityModel.Tokens.Jwt;
using AdminWebsite.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace AdminWebsite.Security.Authentication
{
    public abstract class AadSchemeBase : ProviderSchemeBase, IProviderSchemes
    {
        protected readonly IdpConfiguration IdpConfiguration;

        protected AadSchemeBase(IdpConfiguration idpConfiguration)
        {
            IdpConfiguration = idpConfiguration;
        }

        public bool BelongsToScheme(JwtSecurityToken jwtSecurityToken) => jwtSecurityToken.Issuer.Contains(IdpConfiguration.TenantId, StringComparison.InvariantCultureIgnoreCase);

        public override void SetJwtBearerOptions(JwtBearerOptions options)
        {
            // reform uses client id (config should be null here), SDS uses resource id. 
            // var audience = IdpConfiguration.ResourceId ?? IdpConfiguration.ClientId;
            options.Authority = $"{IdpConfiguration.Authority}{IdpConfiguration.TenantId}/v2.0";
            options.Audience = IdpConfiguration.ClientId;
            options.TokenValidationParameters.NameClaimType = "preferred_username";
            options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
            options.TokenValidationParameters.ValidateLifetime = true;
        }
    }
}
