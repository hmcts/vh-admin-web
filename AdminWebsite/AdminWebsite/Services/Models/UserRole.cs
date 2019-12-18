using AdminWebsite.Security;
using System.Collections.Generic;

namespace AdminWebsite.Services.Models
{
    public class UserRole
    {
        public UserRoleType UserRoleType { get; set; }
        public IEnumerable<string> CaseTypes { get; set; }
    }
}