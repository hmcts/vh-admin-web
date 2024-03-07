using System;

namespace AdminWebsite.Contracts.Requests
{
    public class UpdateHearingInGroupRequest
    {
        public Guid HearingId { get; set; }
        public DateTime ScheduledDateTime { get; set; }
    }
}
