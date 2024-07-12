using AdminWebsite.Mappers;
using AdminWebsite.Models;

namespace AdminWebsite.UnitTests.Mappers
{
    public class NewParticipantRequestMapperTest
    {
        [Test]
        public void Should_map_all_properties_for_new_participant_request()
        {
            var source = new EditParticipantRequest();
            source.CaseRoleName = "caserolename";
            source.ContactEmail = "contactemail";
            source.DisplayName = "displayname";
            source.FirstName = "firstname";
            source.LastName = "lastname";
            source.MiddleNames = "middle name";
            source.Representee = "representee";
            source.TelephoneNumber = "01234567489";
            source.Title = "mr";
            source.OrganisationName = "organisation";

            var result = NewParticipantRequestMapper.MapTo(source);

            result.CaseRoleName.Should().Be(source.CaseRoleName);
            result.ContactEmail.Should().Be(source.ContactEmail);
            result.DisplayName.Should().Be(source.DisplayName);
            result.FirstName.Should().Be(source.FirstName);
            result.LastName.Should().Be(source.LastName);
            result.HearingRoleName.Should().Be(source.HearingRoleName);
            result.MiddleNames.Should().Be(source.MiddleNames);
            result.Representee.Should().Be(source.Representee);
            result.TelephoneNumber.Should().Be(source.TelephoneNumber);
            result.Title.Should().Be(source.Title);
            result.OrganisationName.Should().Be(source.OrganisationName);
        }

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
                InterpreterLanguageCode = "spa"
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
        }
    }
}
