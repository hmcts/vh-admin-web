using VideoApi.Contract.Responses;

namespace AdminWebsite.Extensions
{
    public static class ConferenceDetailsResponseExtensions
    {
        public static bool HasInvalidMeetingRoom(this ConferenceDetailsResponse conference)
        {
            return (conference?.MeetingRoom == null
                            || string.IsNullOrWhiteSpace(conference.MeetingRoom.AdminUri)
                            || string.IsNullOrWhiteSpace(conference.MeetingRoom.ParticipantUri)
                            || string.IsNullOrWhiteSpace(conference.MeetingRoom.JudgeUri)
                            || string.IsNullOrWhiteSpace(conference.MeetingRoom.PexipNode));
        }
    }
}
