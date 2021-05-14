using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Models;
using BookingsApi.Contract.Enums;
using BookingsApi.Contract.Requests;

namespace AdminWebsite.Mappers
{
    public static class HearingUpdateRequestMapper
    {
        public static UpdateHearingRequest MapTo(EditHearingRequest editHearingRequest, string userName)
        {
            var updateHearingRequest = new UpdateHearingRequest
            {
                HearingRoomName = editHearingRequest.HearingRoomName,
                HearingVenueName = editHearingRequest.HearingVenueName,
                OtherInformation = editHearingRequest.OtherInformation,
                ScheduledDateTime = editHearingRequest.ScheduledDateTime,
                ScheduledDuration = editHearingRequest.ScheduledDuration,
                UpdatedBy = userName,
                Cases = new List<CaseRequest>
                {
                    new CaseRequest
                    {
                        Name = editHearingRequest.Case.Name,
                        Number = editHearingRequest.Case.Number
                    }
                },
                QuestionnaireNotRequired = false,
                AudioRecordingRequired = editHearingRequest.Participants.Any(x => x.LinkedParticipants.Any(s => s.Type == LinkedParticipantType.Interpreter)) || editHearingRequest.AudioRecordingRequired,
            };
            return updateHearingRequest;
        }
    }
}