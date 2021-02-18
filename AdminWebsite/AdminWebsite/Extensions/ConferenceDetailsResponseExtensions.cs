using VideoApi.Contract.Responses;

namespace AdminWebsite.Extensions
{
    public static class ConferenceDetailsResponseExtensions
    {
        public static bool HasValidMeetingRoom(this ConferenceDetailsResponse conference)
        {
            if (conference?.MeetingRoom == null) return false;
            return !string.IsNullOrWhiteSpace(conference.MeetingRoom.AdminUri) &&
                   !string.IsNullOrWhiteSpace(conference.MeetingRoom.ParticipantUri) &&
                   !string.IsNullOrWhiteSpace(conference.MeetingRoom.JudgeUri) &&
                   !string.IsNullOrWhiteSpace(conference.MeetingRoom.PexipNode);
        }
    }
}
