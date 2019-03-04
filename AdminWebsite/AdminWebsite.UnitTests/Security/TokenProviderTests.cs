using System;
using AdminWebsite.Configuration;
using AdminWebsite.Security;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Security
{
    public class TokenProviderTests
    {
        private readonly TokenProvider _provider;

        public TokenProviderTests()
        {
            var options = new Mock<IOptions<SecuritySettings>>();
            _provider = new TokenProvider(options.Object);
        }
        
        [Test]
        public void ShouldNotAcceptNullParameters()
        {
            const string definedValue = "defined";
            Assert.Throws<ArgumentNullException>(() => _provider.GetClientAccessToken(null, definedValue, definedValue));
            Assert.Throws<ArgumentNullException>(() => _provider.GetClientAccessToken(definedValue, null, definedValue));
            Assert.Throws<ArgumentNullException>(() => _provider.GetClientAccessToken(definedValue, definedValue, null));
        }
    }
}