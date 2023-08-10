using System;
using System.Collections.Generic;
using BookingsApi.Contract.V1.Enums;

namespace AdminWebsite.Contracts.Responses;

public class HearingDetailResponse
{
    public Guid Id { get; set; }
    public DateTime ScheduledDateTime { get; set; }
    public int ScheduledDuration { get; set; }
    public string HearingVenueName { get; set; }
    public string CaseTypeName { get; set; }
    public string HearingTypeName { get; set; }
    public List<CaseResponse> Cases { get; set; }
    public List<ParticipantResponse> Participants { get; set; }
    public List<TelephoneParticipantResponse> TelephoneParticipants { get; set; }
    public string HearingRoomName { get; set; }
    public string OtherInformation { get; set; }
    public DateTime CreatedDate { get; set; }
    public string CreatedBy { get; set; }
    public string UpdatedBy { get; set; }
    public DateTime UpdatedDate { get; set; }
    public string ConfirmedBy { get; set; }
    public DateTime? ConfirmedDate { get; set; }
    public BookingStatus Status { get; set; }
    public bool QuestionnaireNotRequired { get; set; }
    public bool AudioRecordingRequired { get; set; }
    public string CancelReason { get; set; }
    public List<EndpointResponse> Endpoints { get; set; }
    public Guid? GroupId { get; set; }
}