using AdminWebsite.Contracts.Requests;
using V1 = BookingsApi.Contract.V1.Requests;
using V2 = BookingsApi.Contract.V2.Requests;
namespace AdminWebsite.Mappers;

public static class ParticipantRequestMapper
{
    public static V1.ParticipantRequest MapToV1(this ParticipantRequest participantRequest)
    {
        return new V1.ParticipantRequest
        {
            CaseRoleName = participantRequest.CaseRoleName,
            ContactEmail = participantRequest.ContactEmail,
            DisplayName = participantRequest.DisplayName,
            FirstName = participantRequest.FirstName,
            HearingRoleName = participantRequest.HearingRoleName,
            LastName = participantRequest.LastName,
            MiddleNames = participantRequest.MiddleNames,
            Representee = participantRequest.Representee,
            TelephoneNumber = participantRequest.TelephoneNumber,
            Title = participantRequest.Title,
            Username = participantRequest.Username,
            OrganisationName = participantRequest.OrganisationName,
        };
    }
    
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
            Username = participantRequest.Username,
            OrganisationName = participantRequest.OrganisationName,
        };
    }
}