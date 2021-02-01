using System;
using AdminWebsite.TestAPI.Client;
using AdminWebsite.Testing.Common.Data;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class ConferenceEventRequestBuilder
    {
        private readonly ConferenceEventRequest _request;

        public ConferenceEventRequestBuilder()
        {
            _request = new ConferenceEventRequest()
            {
                Event_id = Guid.NewGuid().ToString(),
                Reason = "Automated",
                Time_stamp_utc = DateTime.UtcNow,
                Transfer_from = RoomType.WaitingRoom,
                Transfer_to = RoomType.WaitingRoom
            };
        }

        public ConferenceEventRequestBuilder FromRoomType(string roomType)
        {
            _request.Transfer_to = roomType;
            return this;
        }

        public ConferenceEventRequestBuilder WithConferenceId(Guid conferenceId)
        {
            _request.Conference_id = conferenceId.ToString();
            return this;
        }

        public ConferenceEventRequestBuilder WithParticipantId(Guid? participantId)
        {
            if (participantId == null)
                throw new DataMisalignedException("Participant Id cannot be null");
            _request.Participant_id = participantId.ToString();
            return this;
        }

        public ConferenceEventRequestBuilder WithEventType(EventType eventType)
        {
            _request.Event_type = eventType;
            return this;
        }

        public ConferenceEventRequest Build()
        {
            return _request;
        }
    }
}
