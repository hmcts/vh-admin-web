using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;

namespace AdminWebsite.Mappers
{
    public static class HearingsForAudioFileSearchMapper
    {
        public static HearingsForAudioFileSearchResponse MapFrom(AudioRecordedHearingsBySearchResponse source)
        {
            return new HearingsForAudioFileSearchResponse
            {
                Id = source.Id,
                CaseName = source.Case_name,
                CaseNumber = source.Case_number,
                CourtroomAccount = source.Courtroom_account,
                CourtroomAccountName = source.Courtroom_account_name,
                HearingRoomName = source.Hearing_room_name,
                HearingVenueName = source.Hearing_venue_name,
                ScheduledDateTime = source.Scheduled_date_time
            };
        }
    }
}