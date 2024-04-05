using AdminWebsite.Contracts.Requests;
using AdminWebsite.Models.EditMultiDayHearing;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.Mappers.EditMultiDayHearing
{
    public static class HearingRequestMapper
    {
        public static HearingRequestV2 MapHearingRequestV2(HearingDetailsResponseV2 hearing,
            HearingChanges hearingChanges,
            EditMultiDayHearingRequest editMultiDayHearingRequest)
        {
            var hearingRequest = new HearingRequestV2
            {
                HearingId = hearing.Id,
                ScheduledDuration = hearingChanges.ScheduledDurationChanged ? 
                    editMultiDayHearingRequest.ScheduledDuration : hearing.ScheduledDuration,
                HearingVenueCode = hearingChanges.HearingVenueCodeChanged ? 
                    editMultiDayHearingRequest.HearingVenueCode : hearing.HearingVenueCode,
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
