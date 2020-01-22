using AcceptanceTests.Common.Configuration;
using AcceptanceTests.Common.Driver.Support;

namespace AdminWebsite.AcceptanceTests.Configuration
{
    public class AdminWebTestConfig : ITestSettingsConfig
    {
        public string TestUsernameStem { get; set; }
        public string TestUserPassword { get; set; }
        public TargetBrowser TargetBrowser { get; set; }
        public TargetDevice TargetDevice { get; set; }
    }
}
