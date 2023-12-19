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
        }
        
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
        ///     When true, applies updates to future days of the multi day hearing as well
        /// </summary>
        public bool UpdateFutureDays { get; set; }
    }
}
