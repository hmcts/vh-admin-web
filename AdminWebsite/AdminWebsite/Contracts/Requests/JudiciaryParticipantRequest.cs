namespace AdminWebsite.Contracts.Requests;

public class JudiciaryParticipantRequest
{
    public string PersonalCode { get; set; }
    public string Role { get; set; }
    public string DisplayName { get; set; }
    public string OptionalContactTelephone { get; set; }
    public string OptionalContactEmail { get; set; }
    public string InterpreterLanguageCode { get; set; }
}
