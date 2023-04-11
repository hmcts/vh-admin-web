namespace AdminWebsite.Configuration
{
    /// <summary>
    ///     Security Settings
    /// </summary>
    public class AzureAdConfiguration : IdpConfiguration
    {
        /// <summary>
        /// Secret used to authenticate as the <see cref="IdpConfiguration.ClientId"/>
        /// </summary>
        public string ClientSecret { get; set; }
        
        /// <summary>
        /// The root url for the microsoft graph api
        /// </summary>
        public string GraphApiBaseUri { get; set; }

        /// <summary>
        ///     Temporary Password for newly created user accounts.
        /// </summary>
        public string TemporaryPassword { get; set; }
    }
}
