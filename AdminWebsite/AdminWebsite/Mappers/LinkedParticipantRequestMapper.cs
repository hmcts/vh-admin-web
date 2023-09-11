using System.Diagnostics.CodeAnalysis;
using AdminWebsite.Contracts.Requests;
using V1 = BookingsApi.Contract.V1;
using V2 = BookingsApi.Contract.V2;

namespace AdminWebsite.Mappers;

public static class LinkedParticipantRequestMapper
{
    public static V1.Requests.LinkedParticipantRequest MapToV1(this LinkedParticipantRequest linkedParticipant)
    {
        return new V1.Requests.LinkedParticipantRequest
        {
            LinkedParticipantContactEmail = linkedParticipant.LinkedParticipantContactEmail,
            ParticipantContactEmail = linkedParticipant.ParticipantContactEmail,
            Type = (V1.Enums.LinkedParticipantType)linkedParticipant.Type
        };
    }   
    
    [ExcludeFromCodeCoverage] //remove once used
    public static V2.Requests.LinkedParticipantRequestV2 MapToV2(this LinkedParticipantRequest linkedParticipant)
    {
        return new V2.Requests.LinkedParticipantRequestV2
        {
            LinkedParticipantContactEmail = linkedParticipant.LinkedParticipantContactEmail,
            ParticipantContactEmail = linkedParticipant.ParticipantContactEmail,
            Type = (V2.Enums.LinkedParticipantTypeV2)linkedParticipant.Type
        };
    }
}