using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Text.Json.Serialization;
using AdminWebsite.Contracts.Enums;

namespace AdminWebsite.Contracts.Requests;

public class BookingDetailsRequest
{
    [JsonRequired]
    public DateTime ScheduledDateTime { get; set; }
    
    [JsonRequired]
    public int ScheduledDuration { get; set; }
    
    public string HearingVenueCode { get; set; }
    public string CaseTypeName { get; set; }
    public string CaseTypeServiceId { get; set; }
    public List<CaseRequest> Cases { get; set; }
    public List<ParticipantRequest> Participants { get; set; }
    public List<JudiciaryParticipantRequest> JudiciaryParticipants { get; set; }
    public string HearingRoomName { get; set; }
    public string OtherInformation { get; set; }
    public string CreatedBy { get; set; }
    
    [JsonRequired]
    public bool AudioRecordingRequired { get; set; }
    
    [DefaultValue(false)]
    [JsonRequired]
    public bool IsMultiDayHearing { get; set; }
    
    [JsonRequired]
    public VideoSupplier ConferenceSupplier { get; set; }
    
    public List<EndpointRequest> Endpoints { get; set; }
    public List<LinkedParticipantRequest> LinkedParticipants { get; set; }
}