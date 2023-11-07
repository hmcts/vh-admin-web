namespace AdminWebsite.Contracts.Requests;

public class JudiciaryParticipantRequest
{
    public string PersonalCode { get; set; }
    public string Role { get; set; }
    public string DisplayName { get; set; }
}


/// <summary>
/// Editing a judiciary participant request
/// </summary>
public class EditJudiciaryParticipantRequest
{
        
}