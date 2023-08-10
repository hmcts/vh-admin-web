using AdminWebsite.Models;
using BookingsApi.Contract.V1.Responses;

namespace AdminWebsite.Mappers
{
    public static class HearingsForAudioFileSearchMapper
    {
        public static HearingsForAudioFileSearchResponse MapFrom(AudioRecordedHearingsBySearchResponse source)
        {
            return new HearingsForAudioFileSearchResponse
            {
                Id = source.Id,
                CaseName = source.CaseName,
                CaseNumber = source.CaseNumber,
                CourtroomAccount = source.CourtroomAccount,
                CourtroomAccountName = source.CourtroomAccountName,
                HearingRoomName = source.HearingRoomName,
                HearingVenueName = source.HearingVenueName,
                ScheduledDateTime = source.ScheduledDateTime
            };
        }
    }
}