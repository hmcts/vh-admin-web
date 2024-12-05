using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Responses;

namespace AdminWebsite.Mappers;

public static class LinkedParticipantResponseMapper
{
    public static LinkedParticipantResponse Map(this BookingsApi.Contract.V2.Responses.LinkedParticipantResponseV2 linkedParticipant)
    {
        return new LinkedParticipantResponse
        {
            LinkedId = linkedParticipant.LinkedId,
            Type = (LinkedParticipantType)linkedParticipant.TypeV2
        };
    }   
    
}