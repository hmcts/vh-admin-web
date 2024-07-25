using System.ComponentModel.DataAnnotations;

namespace AdminWebsite.Contracts.Requests;

public class ParticipantRequest
{
    public string Title { get; set; }
    public string FirstName { get; set; }
    public string MiddleNames { get; set; }
    public string LastName { get; set; }
    public string ContactEmail { get; set; }
    public string TelephoneNumber { get; set; }
    public string Username { get; set; }
    
    [StringLength(255, ErrorMessage = "Display name max length is 255 characters")]
    [RegularExpression(@"^[\p{L}\p{N}\s',._-]+$")]
    public string DisplayName { get; set; }
    public string CaseRoleName { get; set; }
    public string HearingRoleName { get; set; }
    public string HearingRoleCode { get; set; }
    public string Representee { get; set; }
    public string OrganisationName { get; set; }
    public string InterpreterLanguageCode { get; set; }
}