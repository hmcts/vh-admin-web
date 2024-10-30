using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Models;
using AdminWebsite.Security.Authentication;
using AdminWebsite.Services;
using AdminWebsite.Testing.Common.Builders;
using Autofac.Extras.Moq;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.JsonWebTokens;

namespace AdminWebsite.UnitTests.Security.AuthenticationSchemes
{
    public class VhAadSchemeTests
    {
        private AutoMock _mocker;
        private VhAadScheme _sut;

        private AzureAdConfiguration _configuration;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IServiceProvider>()
                .Setup(x => x.GetService(typeof(IAppRoleService)))
                .Returns(_mocker.Mock<IAppRoleService>().Object);
            
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
            // Arrange
            var token = new JwtSecurityToken(issuer: "Issuer");

            // Act
            var belongs = _sut.BelongsToScheme(token);

            // Assert
            belongs.Should().BeFalse();
        }

        [Test]
        public void ShouldReturnTrueIfDoesntBelongsToScheme()
        {
            // Arrange
            var token = new JwtSecurityToken(issuer: _configuration.TenantId.ToUpper());

            // Act
            var belongs = _sut.BelongsToScheme(token);

            // Assert
            belongs.Should().BeTrue();
        }

        [Test]
        public async Task ShouldAddClaimsFromAppRoleService_WhenSecurityContextIs_JwtSecurityToken()
        {
            // arrange
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var userClaimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var httpContext = new DefaultHttpContext()
            {
                User = userClaimsPrincipal,
                RequestServices = _mocker.Mock<IServiceProvider>().Object
            };
            var options = new JwtBearerOptions();
            _sut.SetJwtBearerOptions(options);
            var tokenValidatedContext = new TokenValidatedContext(httpContext, new AuthenticationScheme("name", "displayName", typeof(AuthenticationHandler<JwtBearerOptions>)), options)
            {
                Principal = claimsPrincipal,
                SecurityToken = new JwtSecurityToken(issuer: "Issuer", claims: claimsPrincipal.Claims)
            };
            
            _mocker.Mock<IAppRoleService>().Setup(x => x.GetClaimsForUserAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new List<Claim>(){ new(ClaimTypes.Role, AppRoles.StaffMember) });
            
            // act
            await AadSchemeBase.GetClaimsPostTokenValidation(tokenValidatedContext, options);

            // assert
            claimsPrincipal.IsInRole(AppRoles.StaffMember).Should().BeTrue();
        }
        
        [Test]
        public async Task ShouldAddClaimsFromAppRoleService_WhenSecurityContextIs_JsonWebToken()
        {
            // arrange
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var userClaimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var httpContext = new DefaultHttpContext()
            {
                User = userClaimsPrincipal,
                RequestServices = _mocker.Mock<IServiceProvider>().Object
            };
            var options = new JwtBearerOptions();
            _sut.SetJwtBearerOptions(options);
            var jwtSecurityToken = new JwtSecurityToken(issuer: "Issuer", claims: claimsPrincipal.Claims);
            // convert to JsonWebToken
            JwtSecurityTokenHandler handler = new JwtSecurityTokenHandler();
            // Write the JwtSecurityToken to a string
            string jwtString = handler.WriteToken(jwtSecurityToken);

// Create a new JsonWebToken from the string
            JsonWebToken jsonWebToken = new JsonWebToken(jwtString);
            var tokenValidatedContext = new TokenValidatedContext(httpContext, new AuthenticationScheme("name", "displayName", typeof(AuthenticationHandler<JwtBearerOptions>)), options)
            {
                Principal = claimsPrincipal,
                SecurityToken = jsonWebToken
            };
            
            _mocker.Mock<IAppRoleService>().Setup(x => x.GetClaimsForUserAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new List<Claim>(){ new(ClaimTypes.Role, AppRoles.StaffMember) });
            
            // act
            await AadSchemeBase.GetClaimsPostTokenValidation(tokenValidatedContext, options);

            // assert
            claimsPrincipal.IsInRole(AppRoles.StaffMember).Should().BeTrue();
        }
    }
}
