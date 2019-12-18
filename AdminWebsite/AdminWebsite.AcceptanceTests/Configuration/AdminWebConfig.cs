using System.Collections.Generic;
using AcceptanceTests.Common.Configuration;
using AcceptanceTests.Common.Configuration.Users;

namespace AdminWebsite.AcceptanceTests.Configuration
{
    public class AdminWebConfig
    {
        public AdminWebSecurityConfiguration AzureAdConfiguration { get; set; }
        public AdminWebTestConfig TestConfig { get; set; }
        public List<UserAccount> UserAccounts { get; set; }
        public AdminWebVhServiceConfig VhServices { get; set; }
        public SauceLabsSettingsConfig SauceLabsConfiguration { get; set; }
    }
}
