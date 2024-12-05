using BookingsApi.Contract.V2.Responses;
using UserApi.Contract.Responses;

namespace AdminWebsite.Mappers
{
    public static class UserResponseMapper
    {
        public static PersonResponseV2 MapFrom(UserResponse userResponse)
        {
            return new PersonResponseV2
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
