using System;

namespace AdminWebsite.Models
{
    public class HearingRole : IComparable
    {
        public string Name { get; set; }
        public string UserRole { get; set; }
        
        public int CompareTo(object obj)
        {
            return obj switch
            {
                null => 1,
                HearingRole hearingRole => string.Compare(Name, hearingRole.Name, StringComparison.Ordinal),
                _ => 0
            };
        }
    }
}