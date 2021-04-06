using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Contracts.Responses;

namespace AdminWebsite.Mappers
{
    public static class JudgeResponseMapper
    {
        public static JudgeResponse MapTo(PersonResponse personResponse)
        {
            return new JudgeResponse
            {
                FirstName = personResponse.First_name,
                LastName = personResponse.Last_name,
                Email = personResponse.Username
            };

        }
    }
}
