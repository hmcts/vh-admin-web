using AdminWebsite.Contracts.Requests;
using V2 = BookingsApi.Contract.V2.Requests;
namespace AdminWebsite.Mappers;

public static class ParticipantRequestMapper
{
    public static V2.ParticipantRequestV2 MapToV2(this ParticipantRequest participantRequest)
    {
        return new V2.ParticipantRequestV2
        {
            ContactEmail = participantRequest.ContactEmail,
            DisplayName = participantRequest.DisplayName,
            FirstName = participantRequest.FirstName,
            HearingRoleCode = participantRequest.HearingRoleCode,
            LastName = participantRequest.LastName,
            MiddleNames = participantRequest.MiddleNames,
            Representee = participantRequest.Representee,
            TelephoneNumber = participantRequest.TelephoneNumber,
            Title = participantRequest.Title,
            OrganisationName = participantRequest.OrganisationName,
            InterpreterLanguageCode = participantRequest.InterpreterLanguageCode,
            Screening = participantRequest.ScreeningRequirements.MapToV2()
        };
    }
}