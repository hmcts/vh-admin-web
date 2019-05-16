using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;

namespace AdminWebsite.IntegrationTests.Helper
{
    public class BearerTokenBuilder
    {
        private X509Certificate2 _signingCertificate;
        private const string Issuer = "https://sts.windows.net/{tenantid}/";
        private const string Audience = "https://test";
        private TimeSpan _life = TimeSpan.FromHours(1);
        private DateTime _notBefore = DateTime.UtcNow;
        private readonly List<Claim> _claims = new List<Claim>();
        private readonly JwtSecurityTokenHandler _securityTokenHandler = new JwtSecurityTokenHandler();

        public BearerTokenBuilder ForSubject(string subject)
        {
            if (string.IsNullOrEmpty(subject))
            {
                throw new ArgumentException("Subject cannot be null or empty", nameof(subject));
            }

            if (_claims.FirstOrDefault(claim => claim.Type == "sub") == null)
            {
                _claims.Add(new Claim("sub", subject));
            }

            return this;
        }

        public BearerTokenBuilder WithSigningCertificate(X509Certificate2 certificate)
        {
            _signingCertificate = certificate ?? throw new ArgumentException("Certificate cannot be null or empty", nameof(certificate));

            return this;
        }

        public BearerTokenBuilder WithClaim(string claimType, string value)
        {
            if (string.IsNullOrEmpty(claimType))
            {
                throw new ArgumentException("Claim type cannot be null or empty", nameof(claimType));
            }

            if (value == null)
            {
                value = string.Empty;
            }

            _claims.Add(new Claim(claimType, value));

            return this;
        }

        public BearerTokenBuilder WithClaims(IEnumerable<Claim> claims)
        {
            _claims.AddRange(claims);

            return this;
        }

        public BearerTokenBuilder WithLifetime(TimeSpan life)
        {
            _life = life;

            return this;
        }

        public BearerTokenBuilder NotBefore(DateTime notBefore)
        {
            _notBefore = notBefore;

            return this;
        }

        public string BuildToken()
        {
            if (_signingCertificate == null)
            {
                throw new InvalidOperationException("You must specify an X509 certificate to use for signing the JWT Token");
            }

            var signingCredentials = new SigningCredentials(new X509SecurityKey(_signingCertificate), SecurityAlgorithms.RsaSha256);

            var notBefore = _notBefore;
            var expires = notBefore.Add(_life);

            var identity = new ClaimsIdentity(_claims);

            var securityTokenDescriptor = new SecurityTokenDescriptor
            {
                Audience = Audience,
                Issuer = Issuer,
                NotBefore = notBefore,
                Expires = expires,
                SigningCredentials = signingCredentials,
                Subject = identity
            };

            var token = _securityTokenHandler.CreateToken(securityTokenDescriptor);

            var encodedAccessToken = _securityTokenHandler.WriteToken(token);

            return encodedAccessToken;
        }
    }
}