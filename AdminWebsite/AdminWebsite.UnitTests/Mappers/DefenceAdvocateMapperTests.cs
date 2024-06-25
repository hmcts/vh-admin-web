using AdminWebsite.Contracts.Responses;
using AdminWebsite.Mappers;
using BookingsApi.Contract.V2.Requests;

namespace AdminWebsite.UnitTests.Mappers
{
    public class DefenceAdvocateMapperTests
    {
        [Test]
        public void Should_map_defence_advocates()
        {
            // Arrange
            var existingParticipants = new List<ParticipantResponse>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    ContactEmail = "participant1@email.com"
                }
            };

            var newParticipants = new List<ParticipantRequestV2>
            {
                new()
                {
                    ContactEmail = "newParticipant1@email.com"
                }
            };

            // Act
            var result = DefenceAdvocateMapper.Map(existingParticipants, newParticipants);

            // Assert
            result.Count.Should().Be(existingParticipants.Count + newParticipants.Count);
            result.Should().Contain(x => x.Id == existingParticipants[0].Id && x.ContactEmail == existingParticipants[0].ContactEmail);
            result.Should().Contain(x => x.Id == null && x.ContactEmail == newParticipants[0].ContactEmail);
        }
    }
}
