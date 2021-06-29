using AdminWebsite.Models;
using BookingsApi.Contract.Requests;
using System;

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
            };
            return updateParticipantRequest;
        }
    }
}
