using AdminWebsite.Mappers;
using BookingsApi.Contract.V2.Enums;
using V2 = BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.UnitTests.Mappers
{
    public class JudiciaryParticipantResponseMapperTests
    {
        [Test]
        public void Should_map_response()
        {
            // Arrange
            var response = new V2.JudiciaryParticipantResponse
            {
                Email = "email@email.com",
                Title = "Title",
                FirstName = "FirstName",
                LastName = "LastName",
                FullName = "FullName",
                PersonalCode = "PersonalCode",
                HearingRoleCode = JudiciaryParticipantHearingRoleCode.Judge,
                WorkPhone = "1234",
                DisplayName = "DisplayName",
                InterpreterLanguage = new V2.InterpreterLanguagesResponse
                {
                    Code = "spa",
                    Value = "Spanish",
                    Type = InterpreterType.Verbal,
                    WelshValue = "WelshValue",
                    Live = true
                }
            };

            // Act
            var result = response.Map();

            // Assert
            result.Email.Should().Be(response.Email);
            result.Title.Should().Be(response.Title);
            result.FirstName.Should().Be(response.FirstName);
            result.LastName.Should().Be(response.LastName);
            result.PersonalCode.Should().Be(response.PersonalCode);
            result.RoleCode.Should().Be(response.HearingRoleCode.ToString());
            result.WorkPhone.Should().Be(response.WorkPhone);
            result.DisplayName.Should().Be(response.DisplayName);
            result.InterpreterLanguage.Should().NotBeNull();
            result.InterpreterLanguage.Should().BeEquivalentTo(response.InterpreterLanguage.Map());
        }

        [Test]
        public void Should_map_response_without_interpreter_language()
        {
            // Arrange
            var response = new V2.JudiciaryParticipantResponse
            {
                Email = "email@email.com",
                Title = "Title",
                FirstName = "FirstName",
                LastName = "LastName",
                FullName = "FullName",
                PersonalCode = "PersonalCode",
                HearingRoleCode = JudiciaryParticipantHearingRoleCode.Judge,
                WorkPhone = "1234",
                DisplayName = "DisplayName",
                InterpreterLanguage = null,
                OtherLanguage = "OtherLanguage"
            };

            // Act
            var result = response.Map();

            // Assert
            result.InterpreterLanguage.Should().BeNull();
        }
    }
}
