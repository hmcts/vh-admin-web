﻿using System;
using System.ComponentModel.DataAnnotations;
using AdminWebsite.TestAPI.Client;

namespace AdminWebsite.AcceptanceTests.Data
{
    public class CallbackEvent
    {
        public string EventId { get; set; }
        public EventType EventType { get; set; }
        public DateTime TimeStampUtc { get; set; }
        public Guid ConferenceId { get; set; }
        public Guid ParticipantId { get; set; }

        [EnumDataType(typeof(RoomType))] public RoomType? TransferFrom { get; set; }

        [EnumDataType(typeof(RoomType))] public RoomType? TransferTo { get; set; }

        public string Reason { get; set; }
    }
}
