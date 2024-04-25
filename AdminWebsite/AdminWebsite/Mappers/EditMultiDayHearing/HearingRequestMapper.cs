using AdminWebsite.Contracts.Requests;
using AdminWebsite.Models;
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
            
            if (hearingChanges.ParticipantChanges.Exists(p =>
                    p.ParticipantRequest.HearingRoleCode == HearingRoleCodes.Interpreter))
            {
                // Adding an interpreter forces the audio recording to be required. The update hearing details do not work
                // with the close to start time window, but the domain will update the audio recording required flag when
                // an interpreter is added. Revert to the original audio recording setting to avoid the time clash.
                // This is only an issue because we update hearing details and participants in the same request.
                hearingRequest.AudioRecordingRequired = hearing.AudioRecordingRequired;
            }

            return hearingRequest;
        }
    }
}
