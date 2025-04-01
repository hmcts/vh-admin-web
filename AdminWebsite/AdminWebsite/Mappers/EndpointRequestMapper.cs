using AdminWebsite.Contracts.Requests;
using V2 = BookingsApi.Contract.V2.Requests;

namespace AdminWebsite.Mappers
{
    public static class EndpointRequestMapper
    {
        public static V2.EndpointRequestV2 MapToV2(this EndpointRequest request) =>
            new()
            {
                DisplayName = request.DisplayName,
                LinkedParticipantEmails = request.LinkedParticipantEmails,
                InterpreterLanguageCode = request.InterpreterLanguageCode,
                Screening = request.ScreeningRequirements.MapToV2(),
                ExternalParticipantId = request.ExternalReferenceId
            };
    }
}
