
using AdminWebsite.VideoAPI.Client;

namespace AdminWebsite.Extensions
{
    public static class ConferenceDetailsResponseExtensions
    {
        public static bool HasInvalidMeetingRoom(this ConferenceDetailsResponse conference)
        {
            return (conference?.Meeting_room == null
                            || string.IsNullOrWhiteSpace(conference.Meeting_room.Admin_uri)
                            || string.IsNullOrWhiteSpace(conference.Meeting_room.Participant_uri)
                            || string.IsNullOrWhiteSpace(conference.Meeting_room.Judge_uri)
                            || string.IsNullOrWhiteSpace(conference.Meeting_room.Pexip_node));
        }
    }
}
