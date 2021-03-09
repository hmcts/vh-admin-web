namespace AdminWebsite.AcceptanceTests.Configuration
{
    public class AdminWebVhServiceConfig
    {
        public string AdminWebUrl { get; set; }
        public bool RunningAdminWebLocally { get; set; }
        public string TestApiUrl { get; set; }
        public string TestApiResourceId { get; set; }

        public string NotificationApiUrl { get; set; }
        public string NotificationApiResourceId { get; set; }
    }
}
