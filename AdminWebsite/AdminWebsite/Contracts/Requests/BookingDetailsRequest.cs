using System;
using System.Collections.Generic;
using System.ComponentModel;

namespace AdminWebsite.Contracts.Requests;

public class BookingDetailsRequest
{
    public DateTime ScheduledDateTime { get; set; }
    public int ScheduledDuration { get; set; }
    public string HearingVenueName { get; set; }
    public string HearingVenueCode { get; set; }
    public string CaseTypeName { get; set; }
    public string CaseTypeServiceId { get; set; }
    public string HearingTypeName { get; set; }
    public string HearingTypeCode { get; set; }
    public List<CaseRequest> Cases { get; set; }
    public List<ParticipantRequest> Participants { get; set; }
    public List<JudiciaryParticipantRequest> JudiciaryParticipants { get; set; }
    public string HearingRoomName { get; set; }
    public string OtherInformation { get; set; }
    public string CreatedBy { get; set; }
    public bool AudioRecordingRequired { get; set; }
    [DefaultValue(false)]
    public bool IsMultiDayHearing { get; set; }
    public List<EndpointRequest> Endpoints { get; set; }
    public List<LinkedParticipantRequest> LinkedParticipants { get; set; }
}