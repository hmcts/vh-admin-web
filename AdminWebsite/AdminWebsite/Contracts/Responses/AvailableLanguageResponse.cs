using AdminWebsite.Contracts.Enums;

namespace AdminWebsite.Contracts.Responses
{
    /// <summary>
    /// Defines an available language supported for interpretation
    /// </summary>
    public class AvailableLanguageResponse
    {
        /// <summary>
        /// The short code for the language
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// The plain text description of the language
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// The type of interpretation
        /// </summary>
        public InterprepretationType Type { get; set; }
    }
}
