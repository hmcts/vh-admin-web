using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.V1.Responses;
using BookingsByDateResponse = AdminWebsite.Contracts.Responses.BookingsByDateResponse;

namespace AdminWebsite.Mappers;

public static class BookingsListMapper
{
    public static BookingsListResponse Map(this BookingsResponse bookingsResponse)
    {
        return new BookingsListResponse
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