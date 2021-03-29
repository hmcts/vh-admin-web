using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Mappers;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers
{
    public class JudgeResponseMapperTest
    {
        [Test]
        public void Should_map_person_response_to_judge_response()
        {
            var personResponse = new PersonResponse
            {
                First_name = "Sam",
                Last_name = "Smith",
                Title = "Mr",
                Username = "email.sam@judiciary.net"
            };

            var judgeResponse = JudgeResponseMapper.MapTo(personResponse);

            judgeResponse.FirstName.Should().Be(personResponse.First_name);
            judgeResponse.LastName.Should().Be(personResponse.Last_name);
            judgeResponse.Email.Should().Be(personResponse.Username);
        }
    }
}
