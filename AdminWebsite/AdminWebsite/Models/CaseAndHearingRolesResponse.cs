using System;
using System.Collections.Generic;

namespace AdminWebsite.Models
{
    public class CaseAndHearingRolesResponse : IComparable
    {
        public string Name { get; set; }
        public IEnumerable<HearingRole> HearingRoles { get; set; }

        public int CompareTo(object? obj)
        {
            return obj switch
            {
                null => 1, CaseAndHearingRolesResponse caseRole => string.Compare(Name, caseRole.Name, StringComparison.Ordinal), _ => 0
            };
        }
    }
}
