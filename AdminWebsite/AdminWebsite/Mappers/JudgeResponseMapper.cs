using AdminWebsite.Contracts.Responses;
using BookingsApi.Contract.Responses;

namespace AdminWebsite.Mappers
{
    public static class JudgeResponseMapper
    {
        public static JudgeResponse MapTo(PersonResponse personResponse)
        {
            return new JudgeResponse
            {
                FirstName = personResponse.FirstName,
                LastName = personResponse.LastName,
                Email = personResponse.Username
            };

        }
    }
}
