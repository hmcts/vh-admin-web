using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AdminWebsite.Contracts.Requests;

public class EndpointRequest
{
    [StringLength(255, ErrorMessage = "Display name max length is 255 characters")]
    [RegularExpression(@"^[\p{L}\p{N}\s',._-]+$")]
    public string DisplayName { get; set; }
    public string ExternalReferenceId { get; set; }
    public List<string> LinkedParticipantEmails { get; set; }
    public string InterpreterLanguageCode { get; set; }
    /// <summary>
    /// Screening requirements for an endpoint (optional)
    /// </summary>
    public SpecialMeasureScreeningRequest ScreeningRequirements { get; set; }
}