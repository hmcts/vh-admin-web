using System;
using System.Collections.Generic;

namespace AdminWebsite.Contracts.Responses;

public class TelephoneParticipantResponse
{
    public Guid Id { get; set; }
    public string CaseRoleName { get; set; }
    public string HearingRoleName { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string ContactEmail { get; set; }
    public string TelephoneNumber { get; set; }
    public string MobileNumber { get; set; }
    public string Representee { get; set; }
    public List<LinkedParticipantResponse> LinkedParticipants { get; set; }
}