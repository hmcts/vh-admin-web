using AdminWebsite.Models;
using System;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V2.Requests;

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
        
        public static UpdateParticipantRequestV2 MapToV2(EditParticipantRequest participant)
        {
            var updateParticipantRequest = new UpdateParticipantRequestV2
            {
                Title = participant.Title,
                DisplayName = participant.DisplayName,
                OrganisationName = participant.OrganisationName,
                TelephoneNumber = participant.TelephoneNumber,
                Representee = participant.Representee,
                ParticipantId = participant.Id ?? Guid.Empty,
                FirstName = participant.FirstName,
                LastName = participant.LastName,
                MiddleNames = participant.MiddleNames
            };
            return updateParticipantRequest;
        }
    }
}
