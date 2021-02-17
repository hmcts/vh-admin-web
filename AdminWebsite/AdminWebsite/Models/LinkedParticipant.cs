using System;
using AdminWebsite.BookingsAPI.Client;

namespace AdminWebsite.Models
{
    public class LinkedParticipant
    {
        public Guid Id { get; set; }
        public Guid ParticipantId { get; set; }
        public Guid LinkedId { get; set; }
        public LinkedParticipantType Type { get; set; }
    }
}