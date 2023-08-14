using System;
using AdminWebsite.Contracts.Enums;
using LinkedParticipantType = BookingsApi.Contract.V1.Enums.LinkedParticipantType;

namespace AdminWebsite.Models
{
    public class LinkedParticipant
    {
        public Guid Id { get; set; }
        public Guid ParticipantId { get; set; }
        public Guid LinkedId { get; set; }
        public LinkedParticipantType Type { get; set; }
        public string ParticipantContactEmail { get; set; }
        public string LinkedParticipantContactEmail { get; set; }
    }
}