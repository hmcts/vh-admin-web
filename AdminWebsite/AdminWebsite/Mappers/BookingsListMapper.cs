using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.V1.Responses;
using BookingsByDateResponse = AdminWebsite.Contracts.Responses.BookingsByDateResponse;
using BookingsResponse = AdminWebsite.Contracts.Responses.BookingsResponse;

namespace AdminWebsite.Mappers;

public static class BookingsListMapper
{
    public static BookingsResponse Map(this BookingsApi.Contract.V1.Responses.BookingsResponse bookingsResponse)
    {
        return new BookingsResponse
        {
            NextCursor = bookingsResponse.NextCursor,
            Limit = bookingsResponse.Limit,
            PrevPageUrl = bookingsResponse.PrevPageUrl,
            NextPageUrl = bookingsResponse.NextPageUrl,
            Hearings = bookingsResponse.Hearings?.Select(e
                => new BookingsByDateResponse
                {
                    ScheduledDate = e.ScheduledDate,
                    Hearings = e.Hearings.Select(h => h.Map()).ToList()
                })
                .ToList()
        };
    }
}