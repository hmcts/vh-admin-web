using System;

namespace AdminWebsite.Contracts.Responses
{
    /// <summary>
    /// A public holiday
    /// </summary>
    public class PublicHolidayResponse
    {
        /// <summary>
        /// Name of a public holiday
        /// </summary>
        public string Name { get; set; }
        
        /// <summary>
        /// Date of a public holiday
        /// </summary>
        public DateTime Date { get; set; }
    }
}