using System.Collections.Generic;
using AdminWebsite.Security;

namespace AdminWebsite.Services.Models
{
    public class UserRole
    {
        public UserRoleType UserRoleType { get; set; }
        public IEnumerable<string> CaseTypes { get; set; }
    }
}