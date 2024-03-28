using AdminWebsite.Contracts.Requests;
using AdminWebsite.Models.EditMultiDayHearing;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Responses;

namespace AdminWebsite.Mappers.EditMultiDayHearing
{
    public static class HearingRequestMapper
    {
        public static HearingRequest MapHearingRequest(HearingDetailsResponse hearing,
            HearingChanges hearingChanges,
            EditMultiDayHearingRequest editMultiDayHearingRequest)
        {
            var hearingRequest = new HearingRequest
            {
                HearingId = hearing.Id,
                ScheduledDuration = hearingChanges.ScheduledDurationChanged ? 
                    editMultiDayHearingRequest.ScheduledDuration : hearing.ScheduledDuration,
                HearingVenueName = hearingChanges.HearingVenueNameChanged ? 
                    editMultiDayHearingRequest.HearingVenueName : hearing.HearingVenueName,
                HearingRoomName = hearingChanges.HearingRoomNameChanged ? 
                    editMultiDayHearingRequest.HearingRoomName : hearing.HearingRoomName,
                OtherInformation = hearingChanges.OtherInformationChanged ? 
                    editMultiDayHearingRequest.OtherInformation : hearing.OtherInformation,
                CaseNumber = hearingChanges.CaseNumberChanged ? 
                    editMultiDayHearingRequest.CaseNumber : hearing.Cases[0].Number,
                AudioRecordingRequired = hearingChanges.AudioRecordingRequiredChanged ? 
                    editMultiDayHearingRequest.AudioRecordingRequired : hearing.AudioRecordingRequired
            };

            return hearingRequest;
        }
    }
}
