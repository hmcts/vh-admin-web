using BookingsApi.Contract.Responses;
using UserApi.Contract.Responses;

namespace AdminWebsite.Mappers
{
    public static class UserResponseMapper
    {
        public static PersonResponse MapFrom(UserResponse userResponse)
        {
            return new PersonResponse
            {
                FirstName = userResponse.FirstName,
                LastName = userResponse.LastName,
                ContactEmail = userResponse.ContactEmail,
                Organisation = userResponse.Organisation,
                TelephoneNumber = userResponse.TelephoneNumber,
                Username = userResponse.Email
            };
        }
    }
}
