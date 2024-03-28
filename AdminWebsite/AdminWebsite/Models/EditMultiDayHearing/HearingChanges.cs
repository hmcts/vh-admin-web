using System.Collections.Generic;
using AdminWebsite.Contracts.Responses;

namespace AdminWebsite.Models.EditMultiDayHearing
{
    public class HearingChanges
    {
        public bool ScheduledDurationChanged { get; set; }
        public bool HearingVenueNameChanged { get; set; }
        public bool HearingRoomNameChanged { get; set; }
        public bool OtherInformationChanged { get; set; }
        public bool CaseNumberChanged { get; set; }
        public bool AudioRecordingRequiredChanged { get; set; }
        public LinkedParticipantChanges LinkedParticipantChanges { get; set; } = new();
        
        public List<ParticipantChanges> ParticipantChanges { get; set; } = new();
        public List<ParticipantResponse> RemovedParticipants { get; set; } = new();
    }
}
