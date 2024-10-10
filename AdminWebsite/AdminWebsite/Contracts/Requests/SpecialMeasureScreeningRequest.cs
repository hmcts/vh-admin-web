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
    /// List of participant/endpoint external reference ids to screen from
    /// </summary>
    public List<string> ScreenFromExternalReferenceIds { get; set; }
}