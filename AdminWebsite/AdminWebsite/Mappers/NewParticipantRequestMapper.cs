using AdminWebsite.Models;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V2.Requests;

namespace AdminWebsite.Mappers
{
    public static class NewParticipantRequestMapper
    {
        public static ParticipantRequest MapTo(EditParticipantRequest participant)
        {
            var newParticipant = new ParticipantRequest()
            {
                CaseRoleName = participant.CaseRoleName,
                ContactEmail = participant.ContactEmail,
                DisplayName = participant.DisplayName,
                FirstName = participant.FirstName,
                LastName = participant.LastName,
                HearingRoleName = participant.HearingRoleName,
                MiddleNames = participant.MiddleNames,
                Representee = participant.Representee,
                TelephoneNumber = participant.TelephoneNumber,
                Title = participant.Title,
                OrganisationName = participant.OrganisationName,
            };
            return newParticipant;
        }

        public static ParticipantRequestV2 MapToV2(EditParticipantRequest participant)
        {
            var newParticipant = new ParticipantRequestV2
            {
                ContactEmail = participant.ContactEmail,
                DisplayName = participant.DisplayName,
                FirstName = participant.FirstName,
                LastName = participant.LastName,
                HearingRoleCode = participant.HearingRoleCode,
                MiddleNames = participant.MiddleNames,
                Representee = participant.Representee,
                TelephoneNumber = participant.TelephoneNumber,
                Title = participant.Title,
                OrganisationName = participant.OrganisationName,
                InterpreterLanguageCode = participant.InterpreterLanguageCode,
                Screening = participant.ScreeningRequirements?.MapToV2(),
                ExternalParticipantId = participant.ExternalReferenceId
            };
            return newParticipant;
        }
    }
}
