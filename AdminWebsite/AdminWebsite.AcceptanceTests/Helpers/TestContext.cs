using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver;
using AdminWebsite.AcceptanceTests.Configuration;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Pages;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public class TestContext
    {
        public AdminWebConfig AdminWebConfig { get; set; }
        public AdminWebTokens Tokens { get; set; }
        public DriverSetup Driver { get; set; }
        public UserAccount CurrentUser { get; set; }
        public Page RouteAfterDashboard { get; set; }
        public Test Test { get; set; }
    }
}
