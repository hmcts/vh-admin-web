using AcceptanceTests.Common.Configuration;
using AcceptanceTests.Common.Driver.Enums;

namespace AdminWebsite.AcceptanceTests.Configuration
{
    public class AdminWebTestConfig : ITestSettingsConfig
    {
        public string TestUsernameStem { get; set; }
        public string TestUserPassword { get; set; }
        public TargetBrowser TargetBrowser { get; set; }
        public string TargetBrowserVersion { get; set; }
        public TargetDevice TargetDevice { get; set; }
        public string TargetDeviceName { get; set; }
        public TargetOS TargetOS { get; set; }
    }
}
