using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.JsonWebTokens;

namespace AdminWebsite.Security.Authentication
{
    public abstract class AadSchemeBase : ProviderSchemeBase, IProviderSchemes
    {
        private static readonly ConcurrentDictionary<string, SemaphoreSlim> Semaphores = new();
        private readonly IdpConfiguration _idpConfiguration;

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
            options.Events = new JwtBearerEvents()
            { OnTokenValidated = context => GetClaimsPostTokenValidation(context, options) };
        }

        public async Task GetClaimsPostTokenValidation(TokenValidatedContext context, JwtBearerOptions options)
        {
            if (context.SecurityToken is JwtSecurityToken jwtToken)
            {
                var usernameClaim = jwtToken.Claims.First(x => x.Type == options.TokenValidationParameters.NameClaimType);
                var claims = await GetAdditionalClaimsForUserByUsername(context, usernameClaim, jwtToken.RawPayload);
                context.Principal!.AddIdentity(new ClaimsIdentity(claims));
            }

            if (context.SecurityToken is JsonWebToken jsonWebToken)
            {
                var usernameClaim = jsonWebToken.Claims.First(x => x.Type == options.TokenValidationParameters.NameClaimType);
                var claims = await GetAdditionalClaimsForUserByUsername(context, usernameClaim, jsonWebToken.EncodedPayload);
                context.Principal!.AddIdentity(new ClaimsIdentity(claims));
            }
        }
        
        private static async Task<List<Claim>> GetAdditionalClaimsForUserByUsername(TokenValidatedContext context, Claim usernameClaim, string uniqueId)
        {
            var username = usernameClaim.Value;
            var semaphore = Semaphores.GetOrAdd(username, _ => new SemaphoreSlim(1, 1));

            await semaphore.WaitAsync();
            try
            {
                var appRoleService = context.HttpContext.RequestServices.GetService(typeof(IAppRoleService)) as IAppRoleService;
                var claims = await appRoleService!.GetClaimsForUserAsync(uniqueId, username);
                return claims;
            }
            finally
            {
                semaphore.Release();
            }
        }
    }
}
