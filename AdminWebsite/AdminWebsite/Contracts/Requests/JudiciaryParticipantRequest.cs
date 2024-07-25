using System.ComponentModel.DataAnnotations;

namespace AdminWebsite.Contracts.Requests;

public class JudiciaryParticipantRequest
{
    public string PersonalCode { get; set; }
    public string Role { get; set; }
    
    [StringLength(255, ErrorMessage = "Display name max length is 255 characters")]
    [RegularExpression(@"^[\p{L}\p{N}\s',._-]+$")]
    public string DisplayName { get; set; }
    public string OptionalContactTelephone { get; set; }
    public string OptionalContactEmail { get; set; }
    public string InterpreterLanguageCode { get; set; }
}
