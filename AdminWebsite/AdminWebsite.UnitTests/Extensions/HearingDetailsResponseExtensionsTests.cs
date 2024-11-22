using AdminWebsite.Extensions;
using AdminWebsite.Models;
using FizzWare.NBuilder;
using AdminWebsite.Contracts.Responses;
using VideoApi.Contract.Enums;

namespace AdminWebsite.UnitTests.Extensions
{
    public class HearingDetailsResponseExtensionsTests
    {
        private HearingDetailsResponse _hearing;

        [SetUp]
        public void Setup()
        {
            _hearing = new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                Participants = new List<ParticipantResponse>()
            };
        }
        
    }
}