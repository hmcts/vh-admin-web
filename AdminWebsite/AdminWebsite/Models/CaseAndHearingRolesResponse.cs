using System.Collections.Generic;

namespace AdminWebsite.Models
{
    /// <summary>
    /// Provides the case role and list of the associated hearing roles.
    /// </summary>
    public class CaseAndHearingRolesResponse
    {
        /// <summary>
        /// Gets or sets the case role name.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the associated hearing roles names.
        /// </summary>
        public List<string> HearingRoles { get; set; }
    }
}
