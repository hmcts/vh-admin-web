using System.Security.Claims;
using System.Threading.Tasks;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Http;

namespace AdminWebsite.Middleware
{
    public class UserClaimsMiddleware
    {
        private readonly RequestDelegate _next;

        public UserClaimsMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            if (httpContext.User.Identity is {IsAuthenticated: true})
            {
                var appRoleService = httpContext.RequestServices.GetService(typeof(IAppRoleService)) as IAppRoleService;
                // the bearer token is unique per login session, so we can guarantee the claims are always fresh each login
                httpContext.Request.Headers.TryGetValue("Authorization", out var bearerToken);
                
                var claims = await appRoleService!.GetClaimsForUserAsync(bearerToken, httpContext.User.Identity.Name);
                httpContext.User.AddIdentity(new ClaimsIdentity(claims));
            }
            await _next(httpContext);
        }
    }
}