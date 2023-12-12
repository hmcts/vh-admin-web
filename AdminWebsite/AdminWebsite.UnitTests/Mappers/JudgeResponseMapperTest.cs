using AdminWebsite.Contracts.Enums;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Mappers;
using BookingsApi.Contract.V1.Responses;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers
{
    public class JudgeResponseMapperTest
    {
        [Test]
        public void Should_map_person_response_to_judge_response()
        {
            var personResponse = new JudgeResponse()
            {
                FirstName = "Sam",
                LastName = "Smith",
                Email = "email.sam@judiciary.net",
                ContactEmail = "judge@personal.com"
            };

            var judgeResponse = JudgeResponseMapper.MapTo(personResponse);

            judgeResponse.FirstName.Should().Be(personResponse.FirstName);
            judgeResponse.LastName.Should().Be(personResponse.LastName);
            judgeResponse.Email.Should().Be(personResponse.Email);
            judgeResponse.ContactEmail.Should().Be(personResponse.ContactEmail);
        }

        [Test]
        public void Should_map_judiciary_person_response_to_judge_response()
        {
            var judiciaryPersonResponse = new JudiciaryPersonResponse
            {
                Title = "Mr",
                FirstName = "FirstName",
                LastName = "LastName",
                FullName = "FirstName LastName",
                Email = "email@email.com",
                WorkPhone = "123",
                PersonalCode = "PersonalCode"
            };

            var judgeResponse = JudgeResponseMapper.MapTo(judiciaryPersonResponse);

            judgeResponse.FirstName.Should().Be(judiciaryPersonResponse.FirstName);
            judgeResponse.LastName.Should().Be(judiciaryPersonResponse.LastName);
            judgeResponse.DisplayName.Should().Be(judiciaryPersonResponse.FullName);
            judgeResponse.Email.Should().Be(judiciaryPersonResponse.Email);
            judgeResponse.ContactEmail.Should().Be(judiciaryPersonResponse.Email);
            judgeResponse.AccountType.Should().Be(JudgeAccountType.Judiciary);
        }
    }
}
