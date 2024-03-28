using System.Collections.Generic;

namespace AdminWebsite.Models.EditMultiDayHearing
{
    public class LinkedParticipantChanges
    {
        public List<LinkedParticipant> NewLinkedParticipants { get; set; } = new();
        public List<LinkedParticipant> RemovedLinkedParticipants { get; set; } = new();
    }
}
