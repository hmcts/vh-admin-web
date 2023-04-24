using System;
using System.IdentityModel.Tokens.Jwt;
using AdminWebsite.Configuration;
using AdminWebsite.Security.Authentication;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Security.AuthenticationSchemes
{
    public class Dom1SchemeTests
    {
        private Dom1Scheme sut;
        private Dom1AdConfiguration _dom1AdConfiguration;


        [SetUp]
        public void SetUp()
        {
            _dom1AdConfiguration = new Dom1AdConfiguration()
            {
                Authority = "https://login.microsoftonline.com/",
                ClientId = "Dom1ClientId",
                RedirectUri = "https://localhost:5800/home",
                PostLogoutRedirectUri = "https://localhost:5800/logout",
                TenantId = "Dom1Tenant"
            };
            sut = new Dom1Scheme(_dom1AdConfiguration);
        }

        [Test]
        public void ShouldReturnCorrectProvider()
        {
            // Act
            var provider = sut.Provider;

            // Assert
            provider.Should().Be(AuthProvider.Dom1);
        }

        [Test]
        public void ShouldSetSchemeNameToProvider()
        {
            // Act
            var schemeName = sut.SchemeName;

            // Assert
            schemeName.Should().Be(AuthProvider.Dom1.ToString());
        }

        [Test]
        public void ShouldGetCorrectScheme()
        {
            // Act
            var scheme = (sut as IProviderSchemes).GetScheme();

            // Assert
            scheme.Should().Be(sut.SchemeName);
        }

        [Test]
        public void ShouldSetSchemeOptions()
        {
            // Arrange
            var jwtBearerOptions = new JwtBearerOptions();

            // Act
            sut.SetJwtBearerOptions(jwtBearerOptions);

            // Assert
            jwtBearerOptions.Authority.Should().Be($"{_dom1AdConfiguration.Authority}{_dom1AdConfiguration.TenantId}/v2.0");
            jwtBearerOptions.Audience.Should().Be(_dom1AdConfiguration.ClientId);
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
            var belongs = sut.BelongsToScheme(token);

            // Assert
            belongs.Should().BeFalse();
        }

        [Test]
        public void ShouldReturnTrueIfDoesntBelongsToScheme()
        {
            // Arange
            var token = new JwtSecurityToken(issuer: _dom1AdConfiguration.TenantId);

            // Act
            var belongs = sut.BelongsToScheme(token);

            // Assert
            belongs.Should().BeTrue();
        }
    }
}
