namespace AdminWebsite.Contracts.Responses
{
    /// <summary>
    /// Defines a type of hearing based on case
    /// </summary>
    public class HearingTypeResponse
    {
        /// <summary>
        /// The short code for the type
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Which Service it belongs to
        /// </summary>
        public string Group { get; set; }

        /// <summary>
        /// Unique identifier for this type of hearing
        /// </summary>
        public int? Id { get; set; }

        /// <summary>
        /// Hearing type display name
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// The service id for the type
        /// </summary>
        public string ServiceId { get; set; }
    }
}
