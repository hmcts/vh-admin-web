using System;
using System.Collections.Generic;

namespace AdminWebsite.Contracts.Responses;
public class EndpointResponse
{
    public Guid Id { get; set; }
    public string ExternalReferenceId { get; set; }
    public string MeasuresExternalId { get; set; }
    public string DisplayName { get; set; }
    public string Sip { get; set; }
    public string Pin { get; set; }
    public IList<Guid> LinkedParticipantIds { get; set; } = new List<Guid>();
    public AvailableLanguageResponse InterpreterLanguage { get; set; }
    public ScreeningResponse ScreeningRequirement { get; set; }
}