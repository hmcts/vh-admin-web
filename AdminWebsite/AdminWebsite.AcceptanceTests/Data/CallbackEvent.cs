using System;
using AdminWebsite.TestAPI.Client;
using AdminWebsite.Testing.Common.Data;


namespace AdminWebsite.AcceptanceTests.Data
{
    public class CallbackEvent
    {
        public string EventId { get; set; }
        public EventType EventType { get; set; }
        public DateTime TimeStampUtc { get; set; }
        public Guid ConferenceId { get; set; }
        public Guid ParticipantId { get; set; }

        public RoomType TransferFrom { get; set; }

        public RoomType TransferTo { get; set; }

        public string Reason { get; set; }
    }
}
