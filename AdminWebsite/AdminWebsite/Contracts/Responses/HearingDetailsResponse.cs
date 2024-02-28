using System;
using System.Collections.Generic;
using AdminWebsite.Contracts.Enums;

namespace AdminWebsite.Contracts.Responses;

public class HearingDetailsResponse
{
    public Guid Id { get; set; }
    public DateTime ScheduledDateTime { get; set; }
    public int ScheduledDuration { get; set; }
    /// <summary>
    /// V1 only
    /// </summary>
    public string HearingVenueName { get; set; }
    /// <summary>
    /// V2 only
    /// </summary>
    public string HearingVenueCode { get; set; }
    /// <summary>
    /// V1 only
    /// </summary>
    public string CaseTypeName { get; set; }
    /// <summary>
    /// V2 only
    /// </summary>
    public string ServiceId { get; set; }
    /// <summary>
    /// V1 only
    /// </summary>
    public string HearingTypeName { get; set; }
    /// <summary>
    /// V2 only
    /// </summary>
    public string HearingTypeCode { get; set; }
    public List<CaseResponse> Cases { get; set; }
    public List<ParticipantResponse> Participants { get; set; }
    /// <summary>
    /// V1 only
    /// </summary>
    public List<TelephoneParticipantResponse> TelephoneParticipants { get; set; }
    
    public List<JudiciaryParticipantResponse> JudiciaryParticipants { get; set; }
    
    public string HearingRoomName { get; set; }
    public string OtherInformation { get; set; }
    public DateTime CreatedDate { get; set; }
    public string CreatedBy { get; set; }
    public string UpdatedBy { get; set; }
    public DateTime UpdatedDate { get; set; }
    public string ConfirmedBy { get; set; }
    public DateTime? ConfirmedDate { get; set; }
    public BookingStatus Status { get; set; }
    public bool AudioRecordingRequired { get; set; }
    public string CancelReason { get; set; }
    public List<EndpointResponse> Endpoints { get; set; }
    public Guid? GroupId { get; set; }
    /// <summary>
    /// Scheduled datetime of the last day of the multi day hearing, if applicable
    /// </summary>
    public DateTime? MultiDayHearingLastDayScheduledDateTime { get; set; }
    public List<HearingDetailsResponse> HearingsInGroup { get; set; }
}