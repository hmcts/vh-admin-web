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
                .AddUserSecrets("f99a3fe8-cf72-486a-b90f-b65c27da84ee");

            Security = new SecuritySettings();

            var config = configRootBuilder.Build();
            config.Bind("AzureAd", Security);
        }
        
        public SecuritySettings Security { get; }
    }
}