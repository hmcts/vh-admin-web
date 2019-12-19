using AcceptanceTests.Common.Configuration;

namespace AdminWebsite.AcceptanceTests.Configuration
{
    public class AdminWebSecurityConfiguration : IAzureAdConfig
    {
        public string Authority { get; set; }
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public string TenantId { get; set; }
        public string RedirectUri { get; set; }
        public string PostLogoutRedirectUri { get; set; }
        public string TemporaryPassword { get; set; }
    }
}
