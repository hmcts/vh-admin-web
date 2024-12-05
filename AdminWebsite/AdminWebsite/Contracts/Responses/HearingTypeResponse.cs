namespace AdminWebsite.Contracts.Responses
{
    /// <summary>
    /// Defines a type of hearing based on case
    /// </summary>
    public class HearingTypeResponse
    {
        /// <summary>
        /// Which case type it belongs to
        /// </summary>
        public string Group { get; set; }

        /// <summary>
        /// Unique identifier for this type of hearing
        /// </summary>
        public int? Id { get; set; }

        /// <summary>
        /// The service id for the type
        /// </summary>
        public string ServiceId { get; set; }
    }
}
