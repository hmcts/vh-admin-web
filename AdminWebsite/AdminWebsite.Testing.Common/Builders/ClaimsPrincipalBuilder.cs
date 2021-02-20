using System.Collections.Generic;
using System.Security.Claims;

namespace AdminWebsite.Testing.Common.Builders
{
    public class ClaimsPrincipalBuilder
    {
        private const string Username = "john@hmcts.net";

        private readonly List<Claim> _claims;
        public ClaimsPrincipalBuilder()
        {
            _claims = new List<Claim>
            { 
                new Claim(ClaimTypes.Name, Username),
                new Claim(ClaimTypes.NameIdentifier, "userId"),
                new Claim("name", "John Doe")
            };
        }

        public ClaimsPrincipalBuilder WithRole(string role)
        {
            _claims.Add(new Claim(ClaimTypes.Role, role));
            return this;
        }

        public ClaimsPrincipalBuilder WithUsername(string username)
        {
            var usernameClaimIndex = _claims.FindIndex(x => x.Type == ClaimTypes.Name);
            _claims.RemoveAt(usernameClaimIndex);
            return WithClaim(ClaimTypes.Name, username);
        }

        public ClaimsPrincipalBuilder WithClaim(string claimType, string value)
        {
            _claims.Add(new Claim(claimType, value));
            return this;
        }
        
        public ClaimsPrincipal Build()
        {
            var identity = new ClaimsIdentity(_claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            return claimsPrincipal;
        }
    }
}
