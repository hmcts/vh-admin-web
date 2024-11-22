using AdminWebsite.Contracts.Requests;
using AdminWebsite.Mappers;
using BookingsApi.Contract.V2.Enums;

namespace AdminWebsite.UnitTests.Mappers
{
    public class JudiciaryParticipantRequestMapperTests
    {
        [Test]
        public void Should_map_to_v1()
        {
            // Arrange
            var request = new JudiciaryParticipantRequest
            {
                DisplayName = "DisplayName",
                Role = "Judge",
                PersonalCode = "PersonalCode",
                OptionalContactTelephone = "123",
                OptionalContactEmail = "email@email.com",
                InterpreterLanguageCode = "spa"
            };

            // Act
            var result = request.MapToV2();

            // Assert
            result.DisplayName.Should().Be(request.DisplayName);
            result.HearingRoleCode.Should().Be(JudiciaryParticipantHearingRoleCode.Judge);
            result.PersonalCode.Should().Be(request.PersonalCode);
            result.ContactTelephone.Should().Be(request.OptionalContactTelephone);
            result.ContactEmail.Should().Be(request.OptionalContactEmail);
            result.InterpreterLanguageCode.Should().Be(request.InterpreterLanguageCode);
        }
    }
}
