using System.Collections.Generic;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.AudioRecordings;
using AcceptanceTests.Common.Data.Time;
using AcceptanceTests.Common.Driver.Drivers;
using AdminWebsite.AcceptanceTests.Configuration;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.TestAPI.Client;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public class TestContext
    {
        public TestApiManager Api { get; set; }
        public AzureStorageManager AzureStorage { get; set; }
        public User CurrentUser { get; set; }
        public DriverSetup Driver { get; set; }
        public Page Route { get; set; }
        public Test Test { get; set; }
        public TimeZone TimeZone { get; set; }
        public string Token { get; set; }
        public List<User> Users { get; set; }
        public AdminWebConfig WebConfig { get; set; }
    }
}
