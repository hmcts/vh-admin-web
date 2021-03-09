using System;
using VideoApi.Contract.Enums;


namespace AdminWebsite.AcceptanceTests.Data
{
    public class CallbackEvent
    {
        public string EventId { get; set; }
        public EventType EventType { get; set; }
        public DateTime TimeStampUtc { get; set; }
        public Guid ConferenceId { get; set; }
        public Guid ParticipantId { get; set; }

        public string TransferFrom { get; set; }

        public string TransferTo { get; set; }

        public string Reason { get; set; }
    }
}
