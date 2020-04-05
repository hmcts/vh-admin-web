using System;
using AdminWebsite.Configuration;
using AdminWebsite.Security;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using FluentAssertions;

namespace AdminWebsite.UnitTests.Security
{
    public class TokenProviderTests
    {
        private readonly TokenProvider _provider;
        private readonly Mock<IOptions<SecuritySettings>> _securitySettings;

        public TokenProviderTests()
        {
            _securitySettings = new Mock<IOptions<SecuritySettings>>();
            _securitySettings.Setup(x => x.Value)
                .Returns(new SecuritySettings() { Authority = "https://microsoft.com/test/" });

            _provider = new TokenProvider(_securitySettings.Object);
        }

        [Test]
        public void ShouldNotAcceptNullParameters()
        {
            const string definedValue = "defined";
            Assert.Throws<ArgumentNullException>(() => _provider.GetClientAccessToken(null, definedValue, definedValue));
            Assert.Throws<ArgumentNullException>(() => _provider.GetClientAccessToken(definedValue, null, definedValue));
            Assert.Throws<ArgumentNullException>(() => _provider.GetClientAccessToken(definedValue, definedValue, null));

        }

        [Test]
        public void ShouldAcceptNotNullParametersAndThrowsUnauthorisedException()
        {
            const string definedValue = "defined";
            var ex = Assert.Throws<UnauthorizedAccessException>(() => _provider.GetClientAccessToken(definedValue, definedValue, definedValue));
            ex.Message.Should().Contain("Not authorized to access service");
        }
    }
}