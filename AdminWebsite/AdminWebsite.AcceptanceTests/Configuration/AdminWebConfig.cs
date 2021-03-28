using AcceptanceTests.Common.Configuration;
using AdminWebsite.Configuration;

namespace AdminWebsite.AcceptanceTests.Configuration
{
    public class AdminWebConfig
    {
        public AzureAdConfiguration AzureAdConfiguration { get; set; }
        public bool IsLive { get; set; }
        public AdminWebTestConfig TestConfig { get; set; }
        public AdminWebVhServiceConfig VhServices { get; set; }
        public SauceLabsSettingsConfig SauceLabsConfiguration { get; set; }
        public WowzaConfiguration Wowza { get; set; }

        public KinlyConfiguration KinlyConfiguration { get; set; }
        public NotifyConfiguration NotifyConfiguration { get; set; }
    }
}
