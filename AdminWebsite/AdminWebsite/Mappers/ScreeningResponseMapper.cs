using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Responses;

namespace AdminWebsite.Mappers;

public static class ScreeningResponseMapper
{
    public static ScreeningResponse Map(this BookingsApi.Contract.V2.Responses.ScreeningResponseV2 response,
        BookingsApi.Contract.V2.Responses.HearingDetailsResponseV2 hearingDetails)
    {
        return new ScreeningResponse
        {
            Type = (ScreeningType)response.Type,
            ProtectFrom = response.ProtectedFrom
        };
    }
}