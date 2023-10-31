using System;
using System.Linq;
using AdminWebsite.Contracts.Requests;
using BookingsApi.Contract.V1.Requests.Enums;
using V1 = BookingsApi.Contract.V1.Requests;
using V2 = BookingsApi.Contract.V2.Requests;

namespace AdminWebsite.Mappers;

public static class BookingDetailsRequestMapper
{
    public static V1.BookNewHearingRequest MapToV1(this BookingDetailsRequest bookingDetails)
    {
        return new V1.BookNewHearingRequest
        {
            ScheduledDateTime = bookingDetails.ScheduledDateTime,
            ScheduledDuration = bookingDetails.ScheduledDuration,
            HearingVenueName = bookingDetails.HearingVenueName,
            CaseTypeName = bookingDetails.CaseTypeName,
            HearingTypeName = bookingDetails.HearingTypeName,
            Cases = bookingDetails.Cases?
                .Select(cr => new V1.CaseRequest
                {
                    Number = cr.Number,
                    Name = cr.Name,
                    IsLeadCase = cr.IsLeadCase
                }).ToList(),
            Participants = bookingDetails.Participants?
                .Select(p => p.MapToV1())
                .ToList(),
            HearingRoomName = bookingDetails.HearingRoomName,
            OtherInformation = bookingDetails.OtherInformation,
            CreatedBy = bookingDetails.CreatedBy,
            AudioRecordingRequired = bookingDetails.AudioRecordingRequired,
            IsMultiDayHearing = bookingDetails.IsMultiDayHearing,
            Endpoints = bookingDetails.Endpoints?
                .Select(e => new V1.EndpointRequest
                {
                    DisplayName = e.DisplayName,
                    DefenceAdvocateContactEmail = e.DefenceAdvocateContactEmail,
                }).ToList(),
            LinkedParticipants = bookingDetails.LinkedParticipants?
                .Select(lp => lp.MapToV1()).ToList()
        };
    }
    
    public static V2.BookNewHearingRequestV2 MapToV2(this BookingDetailsRequest bookingDetails)
    {
        return new V2.BookNewHearingRequestV2
        {
            ScheduledDateTime = bookingDetails.ScheduledDateTime,
            ScheduledDuration = bookingDetails.ScheduledDuration,
            HearingVenueCode = bookingDetails.HearingVenueCode,
            ServiceId = bookingDetails.CaseTypeServiceId,
            Cases = bookingDetails.Cases?
                .Select(cr => new V2.CaseRequestV2
                {
                    Number = cr.Number,
                    Name = cr.Name,
                    IsLeadCase = cr.IsLeadCase
                }).ToList(),
            Participants = bookingDetails.Participants?
                .Select(p => p.MapToV2())
                .ToList(),
            JudiciaryParticipants = bookingDetails.JudiciaryParticipants.Select(jp => new V1.JudiciaryParticipantRequest
            {
                DisplayName = jp.DisplayName,
                HearingRoleCode = Enum.Parse<JudiciaryParticipantHearingRoleCode>(jp.Role, ignoreCase:true),
                PersonalCode = jp.PersonalCode
            }).ToList(),
            HearingRoomName = bookingDetails.HearingRoomName,
            OtherInformation = bookingDetails.OtherInformation,
            CreatedBy = bookingDetails.CreatedBy,
            AudioRecordingRequired = bookingDetails.AudioRecordingRequired,
            IsMultiDayHearing = bookingDetails.IsMultiDayHearing,
            Endpoints = bookingDetails.Endpoints?.Select(e => new V2.EndpointRequestV2
            {
                DisplayName = e.DisplayName,
                DefenceAdvocateContactEmail = e.DefenceAdvocateContactEmail,
            }).ToList(),
            LinkedParticipants = bookingDetails.LinkedParticipants?.Select(lp => lp.MapToV2()).ToList()
        };
    }
}