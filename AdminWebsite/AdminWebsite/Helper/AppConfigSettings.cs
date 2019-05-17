using AdminWebsite.BookingsAPI.Client;

namespace AdminWebsite.Helper
{
    /// <summary>
    ///     Application Settings. 
    /// </summary>
    public class AppConfigSettings
    {
        /// <summary>
        ///     Administrator data.
        /// </summary>
        public ParticipantRequest ParticipantRequest { get; set; } = new ParticipantRequest();
    }
}
