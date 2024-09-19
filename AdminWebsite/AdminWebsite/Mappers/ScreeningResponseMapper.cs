using System.Linq;
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
            ProtectFromParticipants = response.ProtectFromParticipantsIds.Select(p => new ProtectFromResponse
            {
                Id = p,
                Value = hearingDetails.Participants.First(x => x.Id == p).ContactEmail
            }).ToList(),
            ProtectFromEndpoints = response.ProtectFromEndpointsIds.Select(x => new ProtectFromResponse
            {
                Id = x,
                Value = hearingDetails.Endpoints.First(e => e.Id == x).DisplayName
            }).ToList()
        };
    }
}