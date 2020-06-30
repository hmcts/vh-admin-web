using System.Collections.Generic;
using AcceptanceTests.Common.AudioRecordings;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver.Drivers;
using AdminWebsite.AcceptanceTests.Configuration;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Pages;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public class TestContext
    {
        public AdminWebConfig WebConfig { get; set; }
        public Apis Apis { get; set; }
        public AdminWebTokens Tokens { get; set; }
        public DriverSetup Driver { get; set; }
        public List<UserAccount> UserAccounts { get; set; }
        public Page Route { get; set; }
        public Test Test { get; set; }
        public UserAccount CurrentUser { get; set; }
        public AzureStorageManager AzureStorage { get; set; }
    }
}
