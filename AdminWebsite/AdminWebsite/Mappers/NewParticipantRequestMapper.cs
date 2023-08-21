﻿using BookingsApi.Contract.V1.Requests;
using AdminWebsite.Models;

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
    }
}
