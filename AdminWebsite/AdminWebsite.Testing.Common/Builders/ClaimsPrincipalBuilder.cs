using System.Collections.Generic;
using System.Security.Claims;

namespace AdminWebsite.Testing.Common.Builders
{
    public class ClaimsPrincipalBuilder
    {
        private const string Username = "john@hmcts.net";
        private readonly List<Claim> _claims;
        
        private static class ClaimTypeNames
        {
            public const string PreferredUsername = "preferred_username";
        }
        
        public ClaimsPrincipalBuilder()
        {
            _claims = new List<Claim>
            { 
                new(ClaimTypeNames.PreferredUsername, Username),
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
            var usernameClaimIndex = _claims.FindIndex(x => x.Type == ClaimTypeNames.PreferredUsername);
            _claims.RemoveAt(usernameClaimIndex);
            return WithClaim(ClaimTypeNames.PreferredUsername, username);
        }

        public ClaimsPrincipalBuilder WithClaim(string claimType, string value)
        {
            _claims.Add(new Claim(claimType, value));
            return this;
        }
        
        public ClaimsPrincipal Build()
        {
            var identity = new ClaimsIdentity(_claims, "TestAuthType", ClaimTypeNames.PreferredUsername, ClaimTypes.Role);
            var claimsPrincipal = new ClaimsPrincipal(identity);
            return claimsPrincipal;
        }
    }
}
