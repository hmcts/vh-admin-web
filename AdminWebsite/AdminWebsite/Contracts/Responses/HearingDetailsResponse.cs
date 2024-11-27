using System;
using System.Collections.Generic;
using AdminWebsite.Contracts.Enums;

namespace AdminWebsite.Contracts.Responses;

public class HearingDetailsResponse
{
    public Guid Id { get; set; }
    public DateTime ScheduledDateTime { get; set; }
    public int ScheduledDuration { get; set; }
    public string HearingVenueCode { get; set; }
    public string HearingVenueName { get; set; }
    public string ServiceId { get; set; }
    public string CaseTypeName { get; set; }
    public List<CaseResponse> Cases { get; set; }
    public List<ParticipantResponse> Participants { get; set; }
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
    
    /// <summary>
    /// The supplier with whom the conference has been booked with
    /// </summary>
    public VideoSupplier ConferenceSupplier { get; set; }

    /// <summary>
    /// Username of the CSO allocated to the hearing, if applicable
    /// </summary>
    public string AllocatedToUsername { get; set; }
}