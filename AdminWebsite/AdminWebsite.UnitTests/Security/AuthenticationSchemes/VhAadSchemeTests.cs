using System;
using System.IdentityModel.Tokens.Jwt;
using AdminWebsite.Configuration;
using AdminWebsite.Security.Authentication;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Security.AuthenticationSchemes
{
    public class VhAadSchemeTests
    {
        private VhAadScheme _sut;

        private AzureAdConfiguration _configuration;

        [SetUp]
        public void SetUp()
        {
            _configuration = new AzureAdConfiguration
            {
                TenantId = "tenantId",
                Authority = "authority",
                ClientId = "clientId"                
            };
            _sut = new VhAadScheme(_configuration);
        }

        [Test]
        public void ShouldReturnCorrectProvider()
        {
            // Act
            var provider = _sut.Provider;

            // Assert
            provider.Should().Be(AuthProvider.VHAAD);
        }

        [Test]
        public void ShouldSetSchemeNameToProvider()
        {
            // Act
            var schemeName = _sut.SchemeName;

            // Assert
            schemeName.Should().Be(AuthProvider.VHAAD.ToString());
        }

        [Test]
        public void ShouldGetCorrectScheme()
        {
            // Act
            var scheme = (_sut as IProviderSchemes).GetScheme();

            // Assert
            scheme.Should().Be(_sut.SchemeName);
        }

        [Test]
        public void ShouldSetSchemeOptions()
        {
            // Arrange
            var jwtBearerOptions = new JwtBearerOptions();

            // Act
            _sut.SetJwtBearerOptions(jwtBearerOptions);

            // Assert
            jwtBearerOptions.Authority.Should().Be($"{_configuration.Authority}{_configuration.TenantId}/v2.0");
            jwtBearerOptions.Audience.Should().Be(_configuration.ClientId);
            jwtBearerOptions.TokenValidationParameters.NameClaimType.Should().Be("preferred_username");
            jwtBearerOptions.TokenValidationParameters.ValidateLifetime.Should().BeTrue();
            jwtBearerOptions.TokenValidationParameters.ClockSkew.Should().Be(TimeSpan.Zero);
        }

        [Test]
        public void ShouldReturnFalseIfDoesntBelongsToScheme()
        {
            // Arange
            var token = new JwtSecurityToken(issuer: "Issuer");

            // Act
            var belongs = _sut.BelongsToScheme(token);

            // Assert
            belongs.Should().BeFalse();
        }

        [Test]
        public void ShouldReturnTrueIfDoesntBelongsToScheme()
        {
            // Arange
            var token = new JwtSecurityToken(issuer: _configuration.TenantId.ToUpper());

            // Act
            var belongs = _sut.BelongsToScheme(token);

            // Assert
            belongs.Should().BeTrue();
        }
    }
}
