using System.Collections.Generic;
using BookingsApi.Contract.V2.Requests;

namespace AdminWebsite.Contracts.Requests;

/// <summary>
/// Screening requirements for a participant
/// </summary>
public class SpecialMeasureScreeningRequest
{
    /// <summary>
    /// True if screen from all, or false if screen from specific participants
    /// </summary>
    public bool ScreenAll { get; set; }
    
    /// <summary>
    /// List of participant contact emails to screen from
    /// </summary>
    public List<string> ScreenFromParticipantContactEmails { get; set; }
    
    /// <summary>
    /// List of endpoint display names to screen from
    /// </summary>
    public List<string> ScreenFromJvsDisplayNames { get; set; }
}