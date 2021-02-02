using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;

namespace AdminWebsite.Mappers
{
    public static class NewParticipantRequestMapper
    {
        public static ParticipantRequest MapTo(EditParticipantRequest participant)
        {
            var newParticipant = new ParticipantRequest()
            {
                Case_role_name = participant.CaseRoleName,
                Contact_email = participant.ContactEmail,
                Display_name = participant.DisplayName,
                First_name = participant.FirstName,
                Last_name = participant.LastName,
                Hearing_role_name = participant.HearingRoleName,
                Middle_names = participant.MiddleNames,
                Representee = participant.Representee,
                Telephone_number = participant.TelephoneNumber,
                Title = participant.Title,
                Organisation_name = participant.OrganisationName,
            };
            return newParticipant;
        }
    }
}
