using AdminWebsite.Contracts.Responses;
using V2 = BookingsApi.Contract.V2.Responses;
namespace AdminWebsite.Mappers;

public static class EndpointResponseMapper
{
    public static EndpointResponse Map(this V2.EndpointResponseV2 endpointResponse, V2.HearingDetailsResponseV2 hearingDetails)
    {
        return new EndpointResponse
        {
            Id = endpointResponse.Id,
            DisplayName = endpointResponse.DisplayName,
            Sip = endpointResponse.Sip,
            Pin = endpointResponse.Pin,
            DefenceAdvocateId = endpointResponse.DefenceAdvocateId,
            InterpreterLanguage = endpointResponse.InterpreterLanguage?.Map(),
            ScreeningRequirement = endpointResponse.Screening?.Map(hearingDetails)
        };
    }
}