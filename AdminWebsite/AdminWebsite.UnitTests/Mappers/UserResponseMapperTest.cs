using AdminWebsite.Mappers;
using UserApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Mappers
{
    public class UserResponseMapperTest
    {
        [Test]
        public void Should_map_all_properties_for_user_response()
        {
            var source = new UserResponse
            {
                Email = "email@email.com",
                FirstName = "FirstName",
                LastName = "TestL",
                ContactEmail = "test@test.com",
                TelephoneNumber = "123",
                DisplayName = "test",
                Organisation = "test Or"
            };

            var result = UserResponseMapper.MapFrom(source);

            result.FirstName.Should().Be(source.FirstName);
            result.LastName.Should().Be(source.LastName);
            result.ContactEmail.Should().Be(source.ContactEmail);
            result.TelephoneNumber.Should().Be(source.TelephoneNumber);
            result.Organisation.Should().Be(source.Organisation);
            result.Username.Should().Be(source.Email);
        }
    }
}
