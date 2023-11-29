namespace AdminWebsite.Contracts.Responses
{
    /// <summary>
    /// Configuration to initialise the UI application
    /// </summary>
    public class ClientSettingsResponse : AzureConfiguration
    {
        /// <summary>
        /// The Application Insights Connection String
        /// </summary>
        public string ConnectionString { get; set; }

        /// <summary>
        /// The reform email
        /// </summary>
        public string TestUsernameStem { get; set; }

        /// <summary>
        /// To join the conference phone number
        /// </summary>
        public string ConferencePhoneNumber { get; set; }

        /// <summary>
        /// To join the conference phone number - welsh
        /// </summary>
        public string ConferencePhoneNumberWelsh { get; set; }

        /// <summary>
        ///  The date to switch on option to join by phone 
        /// </summary>
        public string JoinByPhoneFromDate { get; set; }

        /// <summary>
        /// The Uri to video web url
        /// </summary>
        public string VideoWebUrl { get; set; }

        /// <summary>
        /// The LaunchDarkly Client ID
        /// </summary>
        public string LaunchDarklyClientId { get; internal set; }
        
        /// <summary>
        /// Reform Test Ad tenant configuration
        /// </summary>
        public AzureConfiguration ReformTenantConfig { get; set; }
    }
}
