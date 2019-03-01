namespace AdminWebsite.Configuration
{
    /// <summary>
    ///     Security Settings
    /// </summary>
    public class SecuritySettings
    {
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public string Authority { get; set; }
        public string TenantId { get; set; }
        public string GraphApiBaseUri { get; set; }
        /// <summary>
        ///     Temporary Password for newly created user accounts.
        /// </summary>
        public string TemporaryPassword { get; set; }
        public string InstrumentationKey { get; set; }
    }
}
