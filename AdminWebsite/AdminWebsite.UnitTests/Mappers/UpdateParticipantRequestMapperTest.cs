using AdminWebsite.Mappers;
using AdminWebsite.Models;
using FluentAssertions;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers
{
    public class UpdateParticipantRequestMapperTest
    {
        [Test]
        public void Should_map_all_properties_for_update_participant_request()
        {
            var source = new EditParticipantRequest();
            source.Title = "mr";
            source.DisplayName = "display name";
            source.OrganisationName = "organisation";
            source.TelephoneNumber = "01234567890";
            source.Representee = "representee";

            var result = UpdateParticipantRequestMapper.MapTo(source);

            result.Title.Should().Be(source.Title);
            result.Display_name.Should().Be(source.DisplayName);
            result.Organisation_name.Should().Be(source.OrganisationName);
            result.Telephone_number.Should().Be(source.TelephoneNumber);
            result.Representee.Should().Be(source.Representee);
        }
    }
}
