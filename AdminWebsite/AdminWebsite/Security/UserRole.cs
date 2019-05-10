using System.ComponentModel.DataAnnotations;

namespace AdminWebsite.Security
{
    public enum UserRole
    {
        [Display(Name = "None")] None = 0,
        [Display(Name = "VH Officer")] VhOfficer = 1,
        [Display(Name = "Representative")] Representative = 2,
        [Display(Name = "Individual")] Individual = 3,
        [Display(Name = "Judge")] Judge = 4,
        [Display(Name = "Case Admin")] CaseAdmin = 5
    }
}