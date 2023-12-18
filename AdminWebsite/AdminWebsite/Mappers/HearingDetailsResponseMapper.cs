using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Responses;
using V1 = BookingsApi.Contract.V1.Responses;
using V2 = BookingsApi.Contract.V2.Responses;
namespace AdminWebsite.Mappers;

public static class HearingDetailsResponseMapper
{
    public static HearingDetailsResponse Map(this V1.HearingDetailsResponse hearingDetails)
    {
        return new HearingDetailsResponse
        {
            Id = hearingDetails.Id,
            ScheduledDateTime = hearingDetails.ScheduledDateTime,
            ScheduledDuration = hearingDetails.ScheduledDuration,
            HearingVenueName = hearingDetails.HearingVenueName,
            CaseTypeName = hearingDetails.CaseTypeName,
            HearingTypeName = hearingDetails.HearingTypeName,
            Cases = hearingDetails.Cases?.Select(e => new CaseResponse
            {
                IsLeadCase = e.IsLeadCase,
                Name = e.Name,
                Number = e.Number
            }).ToList(),
            Participants = hearingDetails.Participants?.Map(),
            TelephoneParticipants = new List<TelephoneParticipantResponse>(),
            HearingRoomName = hearingDetails.HearingRoomName,
            OtherInformation = hearingDetails.OtherInformation,
            CreatedDate = hearingDetails.CreatedDate,
            CreatedBy = hearingDetails.CreatedBy,
            UpdatedBy = hearingDetails.UpdatedBy,
            UpdatedDate = hearingDetails.UpdatedDate,
            ConfirmedBy = hearingDetails.ConfirmedBy,
            ConfirmedDate = hearingDetails.ConfirmedDate,
            Status = (Contracts.Enums.BookingStatus)hearingDetails.Status,
            AudioRecordingRequired = hearingDetails.AudioRecordingRequired,
            CancelReason = hearingDetails.CancelReason,
            Endpoints = hearingDetails.Endpoints?.Select(e => e.Map()).ToList(),
            GroupId = hearingDetails.GroupId
        };
    }
    
    public static HearingDetailsResponse Map(this V2.HearingDetailsResponseV2 hearingDetails)
    {
        return new HearingDetailsResponse
        {
            Id = hearingDetails.Id,
            ScheduledDateTime = hearingDetails.ScheduledDateTime,
            ScheduledDuration = hearingDetails.ScheduledDuration,
            HearingVenueName = hearingDetails.HearingVenueName,
            HearingVenueCode = hearingDetails.HearingVenueCode,
            ServiceId = hearingDetails.ServiceId,
            CaseTypeName = hearingDetails.ServiceName,
            Cases = hearingDetails.Cases?.Select(e => new CaseResponse
            {
                IsLeadCase = e.IsLeadCase,
                Name = e.Name,
                Number = e.Number
            }).ToList(),
            Participants = hearingDetails.Participants?.Map(),
            HearingRoomName = hearingDetails.HearingRoomName,
            OtherInformation = hearingDetails.OtherInformation,
            CreatedDate = hearingDetails.CreatedDate,
            CreatedBy = hearingDetails.CreatedBy,
            UpdatedBy = hearingDetails.UpdatedBy,
            UpdatedDate = hearingDetails.UpdatedDate,
            ConfirmedBy = hearingDetails.ConfirmedBy,
            ConfirmedDate = hearingDetails.ConfirmedDate,
            Status = (Contracts.Enums.BookingStatus)hearingDetails.Status,
            AudioRecordingRequired = hearingDetails.AudioRecordingRequired,
            CancelReason = hearingDetails.CancelReason,
            Endpoints = hearingDetails.Endpoints.Select(e => e.Map()).ToList(),
            JudiciaryParticipants = hearingDetails.JudiciaryParticipants?.Select(j => j.Map()).ToList(),
            GroupId = hearingDetails.GroupId
        };
    }
}