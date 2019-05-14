using System.Collections.Generic;

namespace AdminWebsite.Services.Models
{
    public class UserGroupData
    {
        public string UserRole { get; set; }
        public IEnumerable<string> CaseTypes { get; set; }
    }
}