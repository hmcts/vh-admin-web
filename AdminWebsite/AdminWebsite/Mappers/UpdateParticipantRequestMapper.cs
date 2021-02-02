using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;

namespace AdminWebsite.Mappers
{
    public static class UpdateParticipantRequestMapper
    {
        public static UpdateParticipantRequest MapTo(EditParticipantRequest participant)
        {
            var updateParticipantRequest = new UpdateParticipantRequest
            {
                Title = participant.Title,
                Display_name = participant.DisplayName,
                Organisation_name = participant.OrganisationName,
                Telephone_number = participant.TelephoneNumber,
                Representee = participant.Representee,
            };
            return updateParticipantRequest;
        }
    }
}
