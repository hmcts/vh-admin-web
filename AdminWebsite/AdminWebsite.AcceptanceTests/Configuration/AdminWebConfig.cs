using AcceptanceTests.Common.Configuration;

namespace AdminWebsite.AcceptanceTests.Configuration
{
    public class AdminWebConfig
    {
        public AdminWebSecurityConfiguration AzureAdConfiguration { get; set; }
        public bool IsLive { get; set; }
        public AdminWebTestConfig TestConfig { get; set; }
        public AdminWebVhServiceConfig VhServices { get; set; }
        public SauceLabsSettingsConfig SauceLabsConfiguration { get; set; }
        public WowzaConfiguration Wowza { get; set; }

        public KinlyConfiguration KinlyConfiguration { get; set; }
    }
}
