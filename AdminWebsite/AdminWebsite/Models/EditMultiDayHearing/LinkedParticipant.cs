using System;
using AdminWebsite.Contracts.Enums;

namespace AdminWebsite.Models.EditMultiDayHearing
{
    public class LinkedParticipant
    {
        public Guid LinkedId { get; set; }
        public string LinkedParticipantContactEmail { get; set; }
        public Guid ParticipantId { get; set; }
        public string ParticipantContactEmail { get; set; }
        public LinkedParticipantType Type { get; set; }
    }
}
