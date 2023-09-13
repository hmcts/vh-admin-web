﻿using System;
using System.Collections.Generic;

namespace AdminWebsite.Models
{
    /// <summary>
    /// Request for updating an existing hearing
    /// </summary>
    public class EditHearingRequest
    {
        public EditHearingRequest()
        {
            Participants = new List<EditParticipantRequest>();
            Endpoints = new List<EditEndpointRequest>();
        }
        
        /// <summary>
        ///     The date and time for a hearing
        /// </summary>
        public DateTime ScheduledDateTime { get; set; }

        /// <summary>
        ///     The duration of a hearing (number of minutes)
        /// </summary>
        public int ScheduledDuration { get; set; }

        /// <summary>
        ///     The name of the hearing venue
        /// </summary>
        public string HearingVenueName { get; set; }

        /// <summary>
        ///     The hearing room name at the hearing venue
        /// </summary>
        public string HearingRoomName { get; set; }

        /// <summary>
        ///     List of cases associated to the hearing
        /// </summary>
        public EditCaseRequest Case { get; set; }

        /// <summary>
        ///     List of participants in hearing
        /// </summary>
        public List<EditParticipantRequest> Participants { get; set; }

        public List<EditTelephoneParticipantRequest> TelephoneParticipants { get; set; }

        /// <summary>
        ///     Any other information about the hearing
        /// </summary>
        public string OtherInformation { get; set; }

        /// <summary>
        /// Gets or sets audio recording required flag
        /// </summary>
        public bool AudioRecordingRequired { get; set; }
        
        /// <summary>
        /// List of endpoints for the hearing
        /// </summary>
        public List<EditEndpointRequest> Endpoints { get; set; }
    }
}
