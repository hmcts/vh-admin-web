using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Models;
using BookingsApi.Contract.Responses;

namespace AdminWebsite.Mappers
{
    public static class EditParticipantRequestMapper
    {
        public static EditParticipantRequest MapFrom(ParticipantResponse response)
        {
            return new EditParticipantRequest
            {
                Id = response.Id,
                Title = response.Title,
                FirstName = response.FirstName,
                MiddleNames = response.MiddleNames,
                LastName = response.LastName,
                ContactEmail = response.ContactEmail,
                TelephoneNumber = response.TelephoneNumber,
                DisplayName = response.DisplayName,
                CaseRoleName = response.CaseRoleName,
                HearingRoleName = response.HearingRoleName,
                Representee = response.Representee,
                OrganisationName = response.Organisation,
            };

        }
    }
}