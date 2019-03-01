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
        public string BookingsApiUrl => "http://localhost:5000";
        /// <summary>
        ///     The bookings api resource id
        /// </summary>
        public string BookingsApiResourceId { get; set; }
    }
}
