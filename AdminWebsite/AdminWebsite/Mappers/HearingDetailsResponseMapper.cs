using System;
using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.V2.Enums;
using V1 = BookingsApi.Contract.V1.Responses;
using V2 = BookingsApi.Contract.V2.Responses;
namespace AdminWebsite.Mappers;

public static class HearingDetailsResponseMapper
{
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
            Participants = hearingDetails.Participants?.Map(hearingDetails),
            HearingRoomName = hearingDetails.HearingRoomName,
            OtherInformation = hearingDetails.OtherInformation,
            CreatedDate = hearingDetails.CreatedDate,
            CreatedBy = hearingDetails.CreatedBy,
            UpdatedBy = hearingDetails.UpdatedBy,
            UpdatedDate = hearingDetails.UpdatedDate,
            ConfirmedBy = hearingDetails.ConfirmedBy,
            ConfirmedDate = hearingDetails.ConfirmedDate,
            Status = (BookingStatus)hearingDetails.Status,
            AudioRecordingRequired = hearingDetails.AudioRecordingRequired,
            CancelReason = hearingDetails.CancelReason,
            Endpoints = hearingDetails.Endpoints?.Select(e => e.Map(hearingDetails)).ToList(),
            JudiciaryParticipants = hearingDetails.JudiciaryParticipants?.Select(j => j.Map()).ToList(),
            GroupId = hearingDetails.GroupId,
            ConferenceSupplier = Enum.TryParse<VideoSupplier>(hearingDetails.BookingSupplier.ToString(), out var supplier) ? supplier : VideoSupplier.Kinly
        };
    }
    
    public static HearingDetailsResponse Map(this V2.HearingDetailsResponseV2 hearingDetails, ICollection<V2.HearingDetailsResponseV2> hearingsInGroup)
    {
        var response = hearingDetails.Map();
        if (hearingsInGroup == null || !hearingsInGroup.Any()) return response;
        var activeHearings = hearingsInGroup
            .Where(h => 
                h.Status != BookingStatusV2.Cancelled && 
                h.Status != BookingStatusV2.Failed)
            .ToList();
        if (activeHearings.Any())
        {
            response.MultiDayHearingLastDayScheduledDateTime = activeHearings.ScheduledDateTimeOfLastHearing();
        }
        response.HearingsInGroup = hearingsInGroup
            .OrderBy(h => h.ScheduledDateTime)
            .Select(h => h.Map())
            .ToList();
        return response;
    }

    private static DateTime? ScheduledDateTimeOfLastHearing(this IEnumerable<V2.HearingDetailsResponseV2> hearingsInGroup) =>
        hearingsInGroup
            .OrderBy(x => x.ScheduledDateTime)
            .Last()
            .ScheduledDateTime;
}