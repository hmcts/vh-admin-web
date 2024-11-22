using AdminWebsite.Contracts.Responses;
using AdminWebsite.Models;
using V2 = BookingsApi.Contract.V2.Responses;
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
                HearingRoleName = response.HearingRoleName,
                Representee = response.Representee,
                OrganisationName = response.Organisation,
            };
        }
        
        public static EditParticipantRequest MapFrom(V2.ParticipantResponseV2 response)
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
                HearingRoleName = response.HearingRoleName,
                Representee = response.Representee,
                OrganisationName = response.Organisation,
            };
        }
    }
}