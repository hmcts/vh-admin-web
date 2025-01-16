using AdminWebsite.Contracts.Responses;
using BookingsHearingResponse = AdminWebsite.Contracts.Responses.BookingsHearingResponse;

namespace AdminWebsite.Mappers;

public static class BookingsHearingResponseMapper
{
    public static BookingsHearingResponse Map(this BookingsApi.Contract.V1.Responses.BookingsHearingResponse hearingResponse)
    {
        return new BookingsHearingResponse
        {
            HearingId = hearingResponse.HearingId,
            HearingNumber = hearingResponse.HearingNumber,
            HearingName = hearingResponse.HearingName,
            ScheduledDateTime = hearingResponse.ScheduledDateTime,
            ScheduledDuration = hearingResponse.ScheduledDuration,
            CaseType = new CaseTypeResponse
            {
                Name = hearingResponse.CaseTypeName,
                IsAudioRecordingAllowed = hearingResponse.CaseTypeName != "Court of Appeal Criminal Division" && hearingResponse.CaseTypeName != "Crime Crown Court" // TODO replace with value from bookings api
            },
            CourtRoom = hearingResponse.CourtRoom,
            CourtAddress = hearingResponse.CourtAddress,
            JudgeName = hearingResponse.JudgeName,
            CreatedBy = hearingResponse.CreatedBy,
            CreatedDate = hearingResponse.CreatedDate,
            LastEditBy = hearingResponse.LastEditBy,
            LastEditDate = hearingResponse.LastEditDate,
            ConfirmedBy = hearingResponse.ConfirmedBy,
            ConfirmedDate = hearingResponse.ConfirmedDate,
            HearingDate = hearingResponse.HearingDate,
            Status = hearingResponse.Status,
            AudioRecordingRequired = hearingResponse.AudioRecordingRequired,
            CancelReason = hearingResponse.CancelReason,
            GroupId = hearingResponse.GroupId,
            CourtRoomAccount = hearingResponse.CourtRoomAccount,
            AllocatedTo = hearingResponse.AllocatedTo
        };
    }
}