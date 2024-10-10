using System;
using System.Collections.Generic;

namespace AdminWebsite.Contracts.Responses;

public class ParticipantResponse
{
    public Guid Id { get; set; }
    public string ExternalReferenceId { get; set; }
    public string MeasuresExternalId { get; set; }
    public string DisplayName { get; set; }
    public string CaseRoleName { get; set; }
    public string HearingRoleName { get; set; }
    public string HearingRoleCode { get; set; }
    public string UserRoleName { get; set; }
    public string Title { get; set; }
    public string FirstName { get; set; }
    public string MiddleNames { get; set; }
    public string LastName { get; set; }
    public string ContactEmail { get; set; }
    public string TelephoneNumber { get; set; }
    public string Username { get; set; }
    public string Organisation { get; set; }
    public string Representee { get; set; }
    public AvailableLanguageResponse InterpreterLanguage { get; set; }
    public ScreeningResponse ScreeningRequirement { get; set; }
    public List<LinkedParticipantResponse> LinkedParticipants { get; set; } = [];
}