using AcceptanceTests.Common.Configuration;

namespace AdminWebsite.AcceptanceTests.Configuration
{
    public class AdminWebConfig
    {
        public AdminWebSecurityConfiguration AzureAdConfiguration { get; set; }
        public AdminWebTestConfig TestConfig { get; set; }
        public AdminWebVhServiceConfig VhServices { get; set; }
        public SauceLabsSettingsConfig SauceLabsConfiguration { get; set; }
    }
}
