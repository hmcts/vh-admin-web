using System.Collections.Generic;
using System.Linq;
using TestApi.Contract.Dtos;
using TestApi.Contract.Responses;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public static class UserDetailsResponseToUsersMapper
    {
        public static List<UserDto> Map(List<UserDetailsResponse> usersResponses)
        {
            return usersResponses.Select(user => new UserDto()
                {
                    Application = user.Application,
                    ContactEmail = user.ContactEmail,
                    CreatedDate = user.CreatedDate,
                    DisplayName = user.DisplayName,
                    FirstName = user.FirstName,
                    Id = user.Id,
                    IsProdUser = user.IsProdUser,
                    LastName = user.LastName,
                    Number = user.Number,
                    TestType = user.TestType,
                    UserType = user.UserType,
                    Username = user.Username
                })
                .ToList();
        }
    }
}
