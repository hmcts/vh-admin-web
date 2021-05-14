using System;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using RoomType = AdminWebsite.Testing.Common.Data.RoomType;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class ConferenceEventRequestBuilder
    {
        private readonly ConferenceEventRequest _request;

        public ConferenceEventRequestBuilder()
        {
            _request = new ConferenceEventRequest()
            {
                EventId = Guid.NewGuid().ToString(),
                Reason = "Automated",
                TimeStampUtc = DateTime.UtcNow,
                TransferFrom = RoomType.WaitingRoom,
                TransferTo = RoomType.WaitingRoom
            };
        }

        public ConferenceEventRequestBuilder FromRoomType(string roomType)
        {
            _request.TransferTo = roomType;
            return this;
        }

        public ConferenceEventRequestBuilder WithConferenceId(Guid conferenceId)
        {
            _request.ConferenceId = conferenceId.ToString();
            return this;
        }

        public ConferenceEventRequestBuilder WithParticipantId(Guid? participantId)
        {
            if (participantId == null)
                throw new DataMisalignedException("Participant Id cannot be null");
            _request.ParticipantId = participantId.ToString();
            return this;
        }

        public ConferenceEventRequestBuilder WithEventType(EventType eventType)
        {
            _request.EventType = eventType;
            return this;
        }

        public ConferenceEventRequest Build()
        {
            return _request;
        }
    }
}
