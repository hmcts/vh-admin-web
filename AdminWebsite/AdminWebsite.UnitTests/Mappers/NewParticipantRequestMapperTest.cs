using AdminWebsite.Mappers;
using AdminWebsite.Models;

namespace AdminWebsite.UnitTests.Mappers
{
    public class NewParticipantRequestMapperTest
    {

        [Test]
        public void Should_map_to_v2()
        {
            // Arrange
            var participant = new EditParticipantRequest
            {
                ContactEmail = "email@email.com",
                DisplayName = "DisplayName",
                FirstName = "FirstName",
                LastName = "LastName",
                HearingRoleCode = "APPL",
                MiddleNames = "MiddleNames",
                Representee = "Representee",
                TelephoneNumber = "1234",
                Title = "Title",
                OrganisationName = "OrganisationName",
                InterpreterLanguageCode = "spa",
                ExternalReferenceId = "12345abcde"
            };
            
            // Act
            var result = NewParticipantRequestMapper.MapToV2(participant);

            // Assert
            result.ContactEmail.Should().Be(participant.ContactEmail);
            result.DisplayName.Should().Be(participant.DisplayName);
            result.FirstName.Should().Be(participant.FirstName);
            result.LastName.Should().Be(participant.LastName);
            result.HearingRoleCode.Should().Be(participant.HearingRoleCode);
            result.MiddleNames.Should().Be(participant.MiddleNames);
            result.Representee.Should().Be(participant.Representee);
            result.TelephoneNumber.Should().Be(participant.TelephoneNumber);
            result.Title.Should().Be(participant.Title);
            result.OrganisationName.Should().Be(participant.OrganisationName);
            result.InterpreterLanguageCode.Should().Be(participant.InterpreterLanguageCode);
            result.ExternalParticipantId.Should().Be("12345abcde");
        }
    }
}
