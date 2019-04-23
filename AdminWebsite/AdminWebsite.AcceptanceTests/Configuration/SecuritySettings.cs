
namespace AdminWebsite.AcceptanceTests.Configuration
{
    public class SecuritySettings
    {
        public string Authority { get; set; }
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public string RedirectUri { get; set; }
        public string TenantId { get; set; }
        public string PostLogoutRedirectUri { get; set; }
    }
}