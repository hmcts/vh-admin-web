using AdminWebsite.Contracts.Requests;
using BookingsApi.Contract.V1.Requests;

namespace AdminWebsite.Mappers
{
    public static class AddJusticeUserRequestMapper
    {
        public static AddJusticeUserRequest MapToBookingsApiRequest(AddNewJusticeUserRequest request, string createdBy)
        {
            return new AddJusticeUserRequest
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Username = request.Username,
                ContactEmail = request.Username,
                ContactTelephone = request.ContactTelephone,
                CreatedBy = createdBy,
                Roles = request.Roles,
            };
        }
    }
}