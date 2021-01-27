using System.Collections.Generic;

namespace AdminWebsite.Models
{
    public class CaseAndHearingRolesResponse
    {
        public string Name { get; set; }
        public IEnumerable<HearingRole> HearingRoles { get; set; }
    }
}
