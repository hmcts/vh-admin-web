using AdminWebsite.Mappers;
using AdminWebsite.Models;
using FluentAssertions;
using NUnit.Framework;

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
    }
}
