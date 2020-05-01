namespace AdminWebsite.Configuration
{
    /// <summary>
    ///     Service Settings.
    /// </summary>
    public class ServiceSettings
    {
        /// <summary>
        ///     The bookings api url.
        /// </summary>
        public string BookingsApiUrl { get; set; }
        /// <summary>
        ///     The bookings api resource id
        /// </summary>
        public string BookingsApiResourceId { get; set; }
        /// <summary>
        ///     The user api url.
        /// </summary>
        public string UserApiUrl { get; set; }
        /// <summary>
        ///     The user api resource id
        /// </summary>
        public string UserApiResourceId { get; set; }

        /// <summary>
        ///     The pattern to validate email
        /// </summary>
        public string ValidateEmail { get; set; }
    }
}
