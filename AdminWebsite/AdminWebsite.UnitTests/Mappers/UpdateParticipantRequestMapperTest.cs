using AdminWebsite.Mappers;
using BookingsApi.Contract.V2.Responses;

namespace AdminWebsite.UnitTests.Mappers
{
    public class EditParticipantRequestMapperTest
    {
        [Test]
        public void Should_map_all_properties_for_Edit_participant_request()
        {
            var source = new ParticipantResponseV2
            {
                Id = Guid.NewGuid(),
                Title = "Mr",
                FirstName = "TestF",
                MiddleNames = "TestM",
                LastName = "TestL",
                ContactEmail = "test@test.com",
                TelephoneNumber = "123",
                DisplayName = "test",
                HearingRoleName = "test Hearting Role Name",
                Representee = "test Re",
                Organisation = "test Or"
            };
            var result = EditParticipantRequestMapper.MapFrom(source);

            result.Id.Should().Be(source.Id);
            result.Title.Should().Be(source.Title);
            result.MiddleNames.Should().Be(source.MiddleNames);
            result.LastName.Should().Be(source.LastName);
            result.ContactEmail.Should().Be(source.ContactEmail);
            result.TelephoneNumber.Should().Be(source.TelephoneNumber);
            result.DisplayName.Should().Be(source.DisplayName);
            result.HearingRoleName.Should().Be(source.HearingRoleName);
            result.Representee.Should().Be(source.Representee);
            result.OrganisationName.Should().Be(source.Organisation);
        }
    }
}
