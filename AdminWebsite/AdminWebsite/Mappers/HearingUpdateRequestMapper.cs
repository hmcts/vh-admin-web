using System.Collections.Generic;
using AdminWebsite.Models;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V2.Requests;

namespace AdminWebsite.Mappers
{
    public static class HearingUpdateRequestMapper
    {
        public static UpdateHearingRequest MapToV1(EditHearingRequest editHearingRequest, string userName)
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
                    new()
                    {
                        Name = editHearingRequest.Case.Name,
                        Number = editHearingRequest.Case.Number
                    }
                },
                AudioRecordingRequired = editHearingRequest.AudioRecordingRequired
            };
            return updateHearingRequest;
        }
        
        public static UpdateHearingRequestV2 MapToV2(EditHearingRequest editHearingRequest, string userName)
        {
            var updateHearingRequest = new UpdateHearingRequestV2
            {
                HearingRoomName = editHearingRequest.HearingRoomName,
                HearingVenueCode = editHearingRequest.HearingVenueCode,
                OtherInformation = editHearingRequest.OtherInformation,
                ScheduledDateTime = editHearingRequest.ScheduledDateTime,
                ScheduledDuration = editHearingRequest.ScheduledDuration,
                UpdatedBy = userName,
                Cases = new List<CaseRequestV2>
                {
                    new()
                    {
                        Name = editHearingRequest.Case.Name,
                        Number = editHearingRequest.Case.Number
                    }
                },
                AudioRecordingRequired = editHearingRequest.AudioRecordingRequired
            };
            return updateHearingRequest;
        }
    }
}
