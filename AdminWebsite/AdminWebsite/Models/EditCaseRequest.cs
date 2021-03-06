﻿namespace AdminWebsite.Models
{
    /// <summary>
    /// Case request
    /// </summary>
    public class EditCaseRequest
    {
        /// <summary>
        /// The case number
        /// </summary>
        public string Number { get; set; }

        /// <summary>
        /// The case name
        /// </summary>
        public string Name { get; set; }
    }
}
