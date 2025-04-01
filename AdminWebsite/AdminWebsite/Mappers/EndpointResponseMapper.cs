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
            ExternalReferenceId = endpointResponse.ExternalReferenceId,
            MeasuresExternalId = endpointResponse.MeasuresExternalId,
            DisplayName = endpointResponse.DisplayName,
            Sip = endpointResponse.Sip,
            Pin = endpointResponse.Pin,
            LinkedParticipantIds = endpointResponse.LinkedParticipantIds,
            InterpreterLanguage = endpointResponse.InterpreterLanguage?.Map(),
            ScreeningRequirement = endpointResponse.Screening?.Map(hearingDetails)
        };
    }
}