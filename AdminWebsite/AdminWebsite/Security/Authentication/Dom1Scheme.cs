using AdminWebsite.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace AdminWebsite.Security.Authentication
{
    public class Dom1Scheme : AadSchemeBase
    {
        public Dom1Scheme(Dom1AdConfiguration dom1AdConfiguration) : base(dom1AdConfiguration)
        {
        }

        public override AuthProvider Provider => AuthProvider.Dom1;

        public override void SetJwtBearerOptions(JwtBearerOptions options)
        {
            base.SetJwtBearerOptions(options);
            options.Audience = $"api://{_idpConfiguration.ClientId}";
            options.TokenValidationParameters.ValidIssuer = $"https://sts.windows.net/{_idpConfiguration.TenantId}/";
        }
    }
}
