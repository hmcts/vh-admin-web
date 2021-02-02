namespace AdminWebsite.Configuration
{
    public class ServiceSettings
    {
        public string BookingsApiUrl { get; set; }
        public string BookingsApiResourceId { get; set; }
        public string UserApiUrl { get; set; }
        public string UserApiResourceId { get; set; }
        public string VideoApiUrl { get; set; }
        public string VideoApiResourceId { get; set; }
        public string NotificationApiUrl { get; set; }
        public string NotificationApiResourceId { get; set; }
        /// <summary>
        /// To join the conference phone number
        /// </summary>
        public string ConferencePhoneNumber { get; set; }

        public string OptionOnJoinByPhoneDate { get; set; }

    }
}
