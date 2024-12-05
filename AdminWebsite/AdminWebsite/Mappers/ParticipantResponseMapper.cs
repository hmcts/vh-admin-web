using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Responses;
using V2 = BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.Mappers;

public static class ParticipantResponseMapper
{
    public static List<ParticipantResponse> Map(this List<V2.ParticipantResponseV2> participants, BookingsApi.Contract.V2.Responses.HearingDetailsResponseV2 hearingDetails)
    {
        return participants.Select(p =>
            new ParticipantResponse
            {
                Id = p.Id,
                ExternalReferenceId = p.ExternalReferenceId,
                MeasuresExternalId = p.MeasuresExternalId,
                DisplayName = p.DisplayName,
                HearingRoleCode = p.HearingRoleCode,
                HearingRoleName = p.HearingRoleName,
                UserRoleName = p.UserRoleName,
                Title = p.Title,
                FirstName = p.FirstName,
                MiddleNames = p.MiddleNames,
                LastName = p.LastName,
                ContactEmail = p.ContactEmail,
                Username = p.Username,
                TelephoneNumber = p.TelephoneNumber,
                Organisation = p.Organisation,
                Representee = p.Representee,
                InterpreterLanguage = p.InterpreterLanguage?.Map(),
                ScreeningRequirement = p.Screening?.Map(hearingDetails),
                LinkedParticipants = p.LinkedParticipants?.Select(lp => lp.Map()).ToList()
        }).ToList();
    }
}