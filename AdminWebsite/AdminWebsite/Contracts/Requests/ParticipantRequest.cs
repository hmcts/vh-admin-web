using System.ComponentModel.DataAnnotations;

namespace AdminWebsite.Contracts.Requests;

public class ParticipantRequest
{
    public string ExternalReferenceId { get; set; }
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
    public string HearingRoleCode { get; set; }
    public string Representee { get; set; }
    public string OrganisationName { get; set; }
    public string InterpreterLanguageCode { get; set; }
    /// <summary>
    /// Screening requirements for a participant (optional)
    /// </summary>
    public SpecialMeasureScreeningRequest ScreeningRequirements { get; set; }
}