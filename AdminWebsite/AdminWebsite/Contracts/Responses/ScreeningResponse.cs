using System;
using System.Collections.Generic;
using AdminWebsite.Contracts.Enums;

namespace AdminWebsite.Contracts.Responses;

public class ScreeningResponse
{
    /// <summary>
    ///     Is the requirement for all participants or specific participants
    /// </summary>
    public ScreeningType Type { get; set; }
    
    /// <summary>
    ///     A list of participant ids to be protected from
    /// </summary>
    public List<ProtectFromResponse> ProtectFromParticipants { get; set; } = [];
    
    /// <summary>
    ///     A list of endpoint ids to be protected from
    /// </summary>
    public List<ProtectFromResponse> ProtectFromEndpoints { get; set; } = [];
}

public class ProtectFromResponse
{
    /// <summary>
    /// Id of the participant or endpoint to be protected from
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// The participant contact email or endpoint display name 
    /// </summary>
    public string Value { get; set; }
}