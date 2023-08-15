using AdminWebsite.Contracts.Enums;

namespace AdminWebsite.Contracts.Requests;

public class LinkedParticipantRequest
{
    public string ParticipantContactEmail { get; set; }
    public string LinkedParticipantContactEmail { get; set; }
    public LinkedParticipantType Type { get; set; }
}