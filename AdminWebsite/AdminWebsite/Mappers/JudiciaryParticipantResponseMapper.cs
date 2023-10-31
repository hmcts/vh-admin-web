using AdminWebsite.Contracts.Responses;

namespace AdminWebsite.Mappers
{
    public static class JudiciaryParticipantResponseMapper
    {
        public static JudiciaryParticipantResponse Map(this BookingsApi.Contract.V1.Responses.JudiciaryParticipantResponse judiciaryParticipantResponse)
        {
            return new JudiciaryParticipantResponse()
            {
                Email = judiciaryParticipantResponse.Email,
                FirstName = judiciaryParticipantResponse.FirstName,
                LastName = judiciaryParticipantResponse.LastName,
                FullName = judiciaryParticipantResponse.FullName,
                PersonalCode = judiciaryParticipantResponse.PersonalCode,
                RoleCode = judiciaryParticipantResponse.HearingRoleCode.ToString(),
                WorkPhone = judiciaryParticipantResponse.WorkPhone
            };
        }
    }
}