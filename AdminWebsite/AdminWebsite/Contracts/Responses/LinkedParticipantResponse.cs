using System;
using AdminWebsite.Contracts.Enums;

namespace AdminWebsite.Contracts.Responses;

public class LinkedParticipantResponse
{
    public Guid LinkedId { get; set; }
    public LinkedParticipantType Type { get; set; }
}