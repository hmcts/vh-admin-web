using System;

namespace AdminWebsite.Models
{
    public class HearingsByCaseNumberResponse
    {
        /// <summary>
        ///     Hearing Id
        /// </summary>
        public Guid Id { get; set; }

        /// <summary>
        ///     The date and time for a hearing
        /// </summary>
        public DateTime ScheduledDateTime { get; set; }

        /// <summary>
        ///     The name of the hearing venue
        /// </summary>
        public string HearingVenueName { get; set; }

        /// <summary>
        ///     The case number
        /// </summary>
        public string CaseNumber { get; set; }

        /// <summary>
        ///     The case name
        /// </summary>
        public string CaseName { get; set; }

        /// <summary>
        ///     The courtroom account
        /// </summary>
        public string CourtroomAccount { get; set; }

        /// <summary>
        ///     The hearing room name at the hearing venue
        /// </summary>
        public string HearingRoomName { get; set; }
    }
}