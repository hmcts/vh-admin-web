using System.Collections.Generic;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;

namespace AdminWebsite.Mappers
{
    public static class HearingUpdateRequestMapper
    {
        public static UpdateHearingRequest MapTo(EditHearingRequest editHearingRequest, string userName)
        {
            var updateHearingRequest = new UpdateHearingRequest
            {
                Hearing_room_name = editHearingRequest.HearingRoomName,
                Hearing_venue_name = editHearingRequest.HearingVenueName,
                Other_information = editHearingRequest.OtherInformation,
                Scheduled_date_time = editHearingRequest.ScheduledDateTime,
                Scheduled_duration = editHearingRequest.ScheduledDuration,
                Updated_by = userName,
                Cases = new List<CaseRequest>
                {
                    new CaseRequest
                    {
                        Name = editHearingRequest.Case.Name,
                        Number = editHearingRequest.Case.Number
                    }
                },
                Questionnaire_not_required = false,
                Audio_recording_required = editHearingRequest.AudioRecordingRequired
            };
            return updateHearingRequest;
        }
    }
}
