using System;
using AdminWebsite.Configuration;
using AdminWebsite.IntegrationTests.Helper;
using AdminWebsite.Security;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.IntegrationTests.Security
{
    public class TokenProviderIntegrationTests
    {
        private SecuritySettings _settings;
        private TokenProvider _provider;

        [SetUp]
        public void Setup()
        {
            _settings = new TestSettings().Security;
            
            var options = new Mock<IOptions<SecuritySettings>>();
            options.Setup(s => s.Value).Returns(_settings);
            _provider = new TokenProvider(options.Object);
        }

        [Test]
        public void ShouldThrowUnauthorizedExceptionOnUnauthorizedResource()
        {
            Assert.Throws<UnauthorizedAccessException>(() => _provider.GetClientAccessToken(_settings.ClientId, _settings.ClientSecret, "http://something.com"));
        }
    }
}