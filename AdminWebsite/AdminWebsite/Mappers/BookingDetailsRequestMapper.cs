using System.Linq;
using AdminWebsite.Contracts.Requests;
using BookingsApi.Contract.V2.Enums;
using V2 = BookingsApi.Contract.V2.Requests;

namespace AdminWebsite.Mappers;

public static class BookingDetailsRequestMapper
{
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
            JudicialOfficeHolders = bookingDetails.JudiciaryParticipants.Select(jp => jp.MapToV2()).ToList(),
            HearingRoomName = bookingDetails.HearingRoomName,
            OtherInformation = bookingDetails.OtherInformation,
            CreatedBy = bookingDetails.CreatedBy,
            AudioRecordingRequired = bookingDetails.AudioRecordingRequired,
            IsMultiDayHearing = bookingDetails.IsMultiDayHearing,
            Endpoints = bookingDetails.Endpoints?.Select(e => e.MapToV2()).ToList(),
            LinkedParticipants = bookingDetails.LinkedParticipants?.Select(lp => lp.MapToV2()).ToList(),
            BookingSupplier = (BookingSupplier)bookingDetails.ConferenceSupplier
        };
    }
}