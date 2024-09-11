using System.Threading.Tasks;
using AdminWebsite.Services;
using Autofac.Extras.Moq;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Services
{
    public class ConferencesServiceTests
    {
        private AutoMock _mocker;
        private ConferenceDetailsService _serviceUnderTest;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _serviceUnderTest = _mocker.Create<ConferenceDetailsService>();
        }

        [Test]
        public async Task Should_return_response_from_video_api_client()
        {
            var hearingId = Guid.NewGuid();

            var expectedResult = new ConferenceDetailsResponse { HearingId = hearingId };

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByHearingRefIdsAsync(It.IsAny<GetConferencesByHearingIdsRequest>()))
                .ReturnsAsync(new List<ConferenceDetailsResponse> { expectedResult});
            
            var response = await _serviceUnderTest.GetConferenceDetailsByHearingId(hearingId);
            
            _mocker.Mock<IVideoApiClient>().Verify(x => x.GetConferenceDetailsByHearingRefIdsAsync(It.IsAny<GetConferencesByHearingIdsRequest>()), Times.Once);

            response.Should().BeEquivalentTo(expectedResult);
        }
    }
}