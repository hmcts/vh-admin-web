using AdminWebsite.Contracts.Responses;

namespace AdminWebsite.UnitTests.Extensions
{
    public class HearingDetailsResponseExtensionsTests
    {
        [SetUp]
        public void Setup()
        {
            new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                Participants = new List<ParticipantResponse>()
            };
        }
        
    }
}