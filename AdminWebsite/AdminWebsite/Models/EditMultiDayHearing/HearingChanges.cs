using System.Collections.Generic;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Contracts.Responses;

namespace AdminWebsite.Models.EditMultiDayHearing
{
    public class HearingChanges
    {
        public bool ScheduledDurationChanged { get; set; }
        public bool HearingVenueNameChanged { get; set; }
        public bool HearingVenueCodeChanged { get; set; }
        public bool HearingRoomNameChanged { get; set; }
        public bool OtherInformationChanged { get; set; }
        public bool CaseNumberChanged { get; set; }
        public bool AudioRecordingRequiredChanged { get; set; }
        public LinkedParticipantChanges LinkedParticipantChanges { get; set; } = new();
        
        public List<ParticipantChanges> ParticipantChanges { get; set; } = new();
        public List<ParticipantResponse> RemovedParticipants { get; set; } = new();
        public List<EndpointChanges> EndpointChanges { get; set; } = new();
        public List<EndpointResponse> RemovedEndpoints { get; set; } = new();
        public List<JudiciaryParticipantRequest> NewJudiciaryParticipants { get; set; } = new();
        public List<JudiciaryParticipantResponse> RemovedJudiciaryParticipants { get; set; } = new();
    }
}
