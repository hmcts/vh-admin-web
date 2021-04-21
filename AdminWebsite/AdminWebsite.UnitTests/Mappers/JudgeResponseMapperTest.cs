using AdminWebsite.Mappers;
using BookingsApi.Contract.Responses;
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
                FirstName = "Sam",
                LastName = "Smith",
                Title = "Mr",
                Username = "email.sam@judiciary.net"
            };

            var judgeResponse = JudgeResponseMapper.MapTo(personResponse);

            judgeResponse.FirstName.Should().Be(personResponse.FirstName);
            judgeResponse.LastName.Should().Be(personResponse.LastName);
            judgeResponse.Email.Should().Be(personResponse.Username);
        }
    }
}
