using System.Collections.Generic;
using System.Linq;
using AdminWebsite.Contracts.Responses;
using V1 = BookingsApi.Contract.V1.Responses;
using V2 = BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.Mappers;

public static class ParticipantResponseMapper
{
    public static List<ParticipantResponse> Map(this List<V1.ParticipantResponse> participants)
    {
        return participants.Select(p =>
            new ParticipantResponse
            {
                Id = p.Id,
                DisplayName = p.DisplayName,
                CaseRoleName = p.CaseRoleName,
                HearingRoleName = p.HearingRoleName,
                UserRoleName = p.UserRoleName,
                Title = p.Title,
                FirstName = p.FirstName,
                MiddleNames = p.MiddleNames,
                LastName = p.LastName,
                ContactEmail = p.ContactEmail,
                TelephoneNumber = p.TelephoneNumber,
                Username = p.Username,
                Organisation = p.Organisation,
                Representee = p.Representee,
                LinkedParticipants = p.LinkedParticipants?.Select(lp => lp.Map()).ToList()
            }).ToList();
    }

    public static List<ParticipantResponse> Map(this List<V2.ParticipantResponseV2> participants)
    {
        return participants.Select(p =>
            new ParticipantResponse
            {
                Id = p.Id,
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
                LinkedParticipants = p.LinkedParticipants?.Select(lp => lp.Map()).ToList()
        }).ToList();
    }
}