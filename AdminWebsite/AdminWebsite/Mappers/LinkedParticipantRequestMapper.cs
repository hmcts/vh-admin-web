using AdminWebsite.Contracts.Requests;
using V2 = BookingsApi.Contract.V2;

namespace AdminWebsite.Mappers;

public static class LinkedParticipantRequestMapper
{
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