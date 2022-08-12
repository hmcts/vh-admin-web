﻿namespace AdminWebsite.Configuration
{
    /// <summary>
    ///     Security Settings
    /// </summary>
    public class AzureAdConfiguration
    {
        /// <summary>
        /// Id for app registration of this application
        /// </summary>
        public string ClientId { get; set; }

        /// <summary>
        /// Alternative id for the app registration of the application 
        /// </summary>
        public string ResourceId { get; set; }

        /// <summary>
        /// Secret used to authenticate as the <see cref="ClientId"/>
        /// </summary>
        public string ClientSecret { get; set; }

        /// <summary>
        /// The authority to generate and validate Adal tokens against
        /// </summary>
        public string Authority { get; set; }

        /// <summary>
        /// The Azure tenant the app registration defined by <see cref="ClientId"/> is registered in
        /// </summary>
        public string TenantId { get; set; }

        /// <summary>
        /// The root url for the microsoft graph api
        /// </summary>
        public string GraphApiBaseUri { get; set; }

        /// <summary>
        ///     Temporary Password for newly created user accounts.
        /// </summary>
        public string TemporaryPassword { get; set; }

        /// <summary>
        /// The redirect uri on successful login
        /// </summary>
        public string RedirectUri { get; set; }

        /// <summary>
        /// The redirect uri on successful logout
        /// </summary>
        public string PostLogoutRedirectUri { get; set; }
    }
}
