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
    ///     A list of participant/endpoint external ref ids to be protected from
    /// </summary>
    public List<string> ProtectFrom { get; set; } = [];
}