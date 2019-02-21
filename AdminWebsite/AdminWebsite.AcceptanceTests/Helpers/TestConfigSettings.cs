using Microsoft.Extensions.Configuration;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public class TestConfigSettings
    {

        public string JudgeEmail { get; set; }
        public string AdminEmail { get; set; }
        public string ClerkEmail { get; set; }
        public string Citizen1Email { get; set; }
        public string Professional1Email { get; set; }
        public string Citizen2Email { get; set; }
        public string Professional2Email { get; set; }
        public string Password { get; set; }

        public string WebsiteUrl { get; set; }
        public string HearingCaseName { get; set; }
        public string VideoAppUrl { get; set; }

        public static TestConfigSettings GetSettings(string userSecretsKey)
        {
            var config = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", false, true)
                .AddUserSecrets(userSecretsKey)
                .AddEnvironmentVariables()
                .Build();

            var settings = new TestConfigSettings();
            config.GetSection("TestUserSecrets").Bind(settings);
            config.Bind(settings); ;

            return settings;
        }
    }
}
