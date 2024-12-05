using System;
using AdminWebsite.Contracts.Requests;
using BookingsApi.Contract.V2.Enums;
using V2 = BookingsApi.Contract.V2.Requests;

namespace AdminWebsite.Mappers
{
    public static class JudiciaryParticipantRequestMapper
    {
        public static V2.JudiciaryParticipantRequest MapToV2(this JudiciaryParticipantRequest request) =>
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
