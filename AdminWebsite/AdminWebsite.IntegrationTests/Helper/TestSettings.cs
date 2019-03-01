using AdminWebsite.Configuration;
using Microsoft.Extensions.Configuration;

namespace AdminWebsite.IntegrationTests.Helper
{
    public class TestSettings
    {
        public TestSettings()
        {
            var configRootBuilder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddUserSecrets<Startup>();

            Security = new SecuritySettings();

            var config = configRootBuilder.Build();
            config.Bind("AzureAd", Security);
        }
        
        public SecuritySettings Security { get; }
    }
}