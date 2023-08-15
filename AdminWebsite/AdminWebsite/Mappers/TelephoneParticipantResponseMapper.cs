using System.Linq;
using AdminWebsite.Contracts.Responses;
using V1 = BookingsApi.Contract.V1.Responses;

namespace AdminWebsite.Mappers;

public static class TelephoneParticipantResponseMapper
{
    public static TelephoneParticipantResponse Map(this V1.TelephoneParticipantResponse telephoneParticipant)
    {
        return new TelephoneParticipantResponse
        {
            Id = telephoneParticipant.Id,
            CaseRoleName = telephoneParticipant.CaseRoleName,
            HearingRoleName = telephoneParticipant.HearingRoleName,
            FirstName = telephoneParticipant.FirstName,
            LastName = telephoneParticipant.LastName,
            ContactEmail = telephoneParticipant.ContactEmail,
            TelephoneNumber = telephoneParticipant.TelephoneNumber,
            MobileNumber = telephoneParticipant.MobileNumber,
            Representee = telephoneParticipant.Representee,
            LinkedParticipants = telephoneParticipant.LinkedParticipants?.Select(lp => lp.Map()).ToList()
        };
    }
}