using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;

namespace AdminWebsite.Security.Authentication
{
    public abstract class ProviderSchemeBase
    {
        public abstract AuthProvider Provider { get; }

        public string SchemeName => Provider.ToString();

        public AuthenticationBuilder AddScheme(AuthenticationBuilder builder)
        {
            return builder.AddJwtBearer(SchemeName, SetJwtBearerOptions);
        }
        
        public abstract void SetJwtBearerOptions(JwtBearerOptions options);
    }
}
