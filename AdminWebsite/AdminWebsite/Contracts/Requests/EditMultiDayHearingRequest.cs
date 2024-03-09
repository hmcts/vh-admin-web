using System.Collections.Generic;
using AdminWebsite.Models;

namespace AdminWebsite.Contracts.Requests
{
    public class EditMultiDayHearingRequest
    {
        public EditMultiDayHearingRequest()
        {
            Participants = new List<EditParticipantRequest>();
            Endpoints = new List<EditEndpointRequest>();
            JudiciaryParticipants = new List<JudiciaryParticipantRequest>();
            HearingsInGroup = new List<UpdateHearingInGroupRequest>();
        }
        
        /// <summary>
        ///     Duration of the hearing
        /// </summary>
        public int ScheduledDuration { get; set; }
        
        /// <summary>
        ///     The name of the hearing venue
        /// </summary>
        public string HearingVenueName { get; set; }
        
        /// <summary>
        ///     The code of the hearing venue
        /// </summary>
        public string HearingVenueCode { get; set; }

        /// <summary>
        ///     The hearing room name at the hearing venue
        /// </summary>
        public string HearingRoomName { get; set; }

        /// <summary>
        ///     Any other information about the hearing
        /// </summary>
        public string OtherInformation { get; set; }

        /// <summary>
        ///     The case number
        /// </summary>
        public string CaseNumber { get; set; }

        /// <summary>
        ///     Gets or sets the audio recording required flag, value true  is indicated that recording is required, otherwise false
        /// </summary>
        public bool AudioRecordingRequired { get; set; }
        
        /// <summary>
        ///     List of participants in hearing
        /// </summary>
        public List<EditParticipantRequest> Participants { get; set; }
        
        /// <summary>
        ///     List of judiciary participants in hearing
        /// </summary>
        public List<JudiciaryParticipantRequest> JudiciaryParticipants { get; set; }
        
        /// <summary>
        ///     List of endpoints for the hearing
        /// </summary>
        public List<EditEndpointRequest> Endpoints { get; set; }
        
        /// <summary>
        ///     Details specific to each hearing in the multi day group
        /// </summary>
        public List<UpdateHearingInGroupRequest> HearingsInGroup { get; set; }
        
        /// <summary>
        ///     When true, applies updates to future days of the multi day hearing as well
        /// </summary>
        public bool UpdateFutureDays { get; set; }
    }
}
