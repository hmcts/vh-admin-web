using System;
using AdminWebsite.Contracts.Requests;
using BookingsApi.Contract.V1.Requests.Enums;
using V1 = BookingsApi.Contract.V1.Requests;

namespace AdminWebsite.Mappers
{
    public static class JudiciaryParticipantRequestMapper
    {
        public static V1.JudiciaryParticipantRequest MapToV1(this JudiciaryParticipantRequest request) =>
            new()
            {
                DisplayName = request.DisplayName,
                HearingRoleCode = Enum.Parse<JudiciaryParticipantHearingRoleCode>(request.Role, ignoreCase: true),
                PersonalCode = request.PersonalCode,
                ContactTelephone = request.OptionalContactTelephone,
                ContactEmail = request.OptionalContactEmail,
                InterpreterLanguageCode = request.InterpreterLanguageCode
            };
    }
}
