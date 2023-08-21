using AdminWebsite.Models;
using System;
using BookingsApi.Contract.V1.Requests;

namespace AdminWebsite.Mappers
{
    public static class UpdateParticipantRequestMapper
    {
        public static UpdateParticipantRequest MapTo(EditParticipantRequest participant)
        {
            var updateParticipantRequest = new UpdateParticipantRequest
            {
                Title = participant.Title,
                DisplayName = participant.DisplayName,
                OrganisationName = participant.OrganisationName,
                TelephoneNumber = participant.TelephoneNumber,
                Representee = participant.Representee,
                ParticipantId = participant.Id ?? Guid.Empty,
                ContactEmail = participant.ContactEmail 
            };
            return updateParticipantRequest;
        }
    }
}
