using System;
using AdminWebsite.Contracts.Enums;
using BookingStatus = BookingsApi.Contract.V1.Enums.BookingStatus;

namespace AdminWebsite.Contracts.Responses;

public class BookingsHearingResponse
{
    public Guid HearingId { get; set; }
    public string HearingNumber { get; set; }
    public string HearingName { get; set; }
    public DateTime ScheduledDateTime { get; set; }
    public int ScheduledDuration { get; set; }
    public string CaseTypeName { get; set; }
    public string CourtRoom { get; set; }
    public string CourtAddress { get; set; }
    public string JudgeName { get; set; }
    public string CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public string LastEditBy { get; set; }
    public DateTime? LastEditDate { get; set; }
    public string ConfirmedBy { get; set; }
    public DateTime? ConfirmedDate { get; set; }
    public DateTime HearingDate { get; set; }
    public BookingStatus Status { get; set; }
    public bool AudioRecordingRequired { get; set; }
    public string CancelReason { get; set; }
    public Guid? GroupId { get; set; }
    public string CourtRoomAccount { get; set; }
    public string AllocatedTo { get; set; }
    public VideoSupplier? ConferenceSupplier { get; set; }
}