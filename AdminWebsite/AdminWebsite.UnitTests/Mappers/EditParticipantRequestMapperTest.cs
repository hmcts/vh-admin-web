using AdminWebsite.Mappers;
using AdminWebsite.Models;

namespace AdminWebsite.UnitTests.Mappers
{
    public class UpdateParticipantRequestMapperTest
    {
        [Test]
        public void Should_map_all_properties_for_update_participant_request()
        {
            var source = new EditParticipantRequest
            {
                Title = "mr",
                DisplayName = "display name",
                OrganisationName = "organisation",
                TelephoneNumber = "01234567890",
                Representee = "representee"
            };

            var result = UpdateParticipantRequestMapper.MapTo(source);

            result.Title.Should().Be(source.Title);
            result.DisplayName.Should().Be(source.DisplayName);
            result.OrganisationName.Should().Be(source.OrganisationName);
            result.TelephoneNumber.Should().Be(source.TelephoneNumber);
            result.Representee.Should().Be(source.Representee);
        }

        [Test]
        public void Should_map_all_properties_for_Update_participant_request_v2()
        {
            var source = new EditParticipantRequest
            {
                Title = "mr",
                DisplayName = "display name",
                OrganisationName = "organisation",
                TelephoneNumber = "01234567890",
                Representee = "representee"
            };

            var result = UpdateParticipantRequestMapper.MapToV2(source);

            result.Title.Should().Be(source.Title);
            result.DisplayName.Should().Be(source.DisplayName);
            result.OrganisationName.Should().Be(source.OrganisationName);
            result.TelephoneNumber.Should().Be(source.TelephoneNumber);
            result.Representee.Should().Be(source.Representee);
        }
    }
}
