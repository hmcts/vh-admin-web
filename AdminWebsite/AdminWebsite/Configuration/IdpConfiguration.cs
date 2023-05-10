namespace AdminWebsite.Configuration
{
    public abstract class IdpConfiguration
    {
        /// <summary>
        /// Id for app registration of this application
        /// </summary>
        public string ClientId { get; set; }
        
        /// <summary>
        /// The authority to generate and validate Adal tokens against
        /// </summary>
        public string Authority { get; set; }
        
        /// <summary>
        /// The Azure tenant the app registration defined by <see cref="ClientId"/> is registered in
        /// </summary>
        public string TenantId { get; set; }
    
        /// <summary>
        /// The redirect uri on successful login
        /// </summary>
        public string RedirectUri { get; set; }

        /// <summary>
        /// The redirect uri on successful logout
        /// </summary>
        public string PostLogoutRedirectUri { get; set; }
    
        /// <summary>
        /// Alternative id for the app registration of the application 
        /// </summary>
        public string ResourceId { get; set; }
    }
}