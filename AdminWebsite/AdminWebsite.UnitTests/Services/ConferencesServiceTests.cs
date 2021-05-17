using System;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Services;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Services
{
    public class ConferencesServiceTests
    {
        private AutoMock _mocker;
        private IConferenceDetailsService _serviceUnderTest;
        
        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _serviceUnderTest = _mocker.Create<ConferenceDetailsService>();
        }

        [Test]
        public async Task Should_call_polly_wait_retry_and_return_expected_response()
        {
            Guid hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(),
                HearingId = hearingId,
                MeetingRoom = new MeetingRoomResponse
                {
                    JudgeUri = "judge",
                    ParticipantUri = "participant",
                    PexipNode = "pexip"
                }
            };
            
            _mocker.Mock<IPollyRetryService>().Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
            (
            It.IsAny<int>(), It.IsAny<Func<int, TimeSpan>>(), It.IsAny<Action<int>>(),
            It.IsAny<Func<ConferenceDetailsResponse, bool>>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>()
            ))
            .Callback(async (int retries, Func<int, TimeSpan> sleepDuration, Action<int> retryAction,
                Func<ConferenceDetailsResponse, bool> handleResultCondition, Func<Task<ConferenceDetailsResponse>> executeFunction) =>
            {
                sleepDuration(1);
                retryAction(1);
                handleResultCondition(expectedConferenceDetailsResponse);
                await executeFunction();
            })
            .ReturnsAsync(expectedConferenceDetailsResponse);

            var response = await _serviceUnderTest.GetConferenceDetailsByHearingIdWithRetry(hearingId, "error message");
            
            _mocker.Mock<IPollyRetryService>().Verify(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
               (
                   It.IsAny<int>(), It.IsAny<Func<int, TimeSpan>>(), It.IsAny<Action<int>>(),
                   It.IsAny<Func<ConferenceDetailsResponse, bool>>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>()
               ), Times.AtLeastOnce);

            response.Should().Be(expectedConferenceDetailsResponse);
        }
        
        [Test]
        public async Task Should_return_an_empty_respons_if_an_exception_is_thrown()
        {
            Guid hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse();
            
            _mocker.Mock<IPollyRetryService>().Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
            (
            It.IsAny<int>(), It.IsAny<Func<int, TimeSpan>>(), It.IsAny<Action<int>>(),
            It.IsAny<Func<ConferenceDetailsResponse, bool>>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>()
            ))
            .Callback(async (int retries, Func<int, TimeSpan> sleepDuration, Action<int> retryAction,
                Func<ConferenceDetailsResponse, bool> handleResultCondition, Func<Task<ConferenceDetailsResponse>> executeFunction) =>
            {
                sleepDuration(1);
                retryAction(7);
                handleResultCondition(expectedConferenceDetailsResponse);
                await executeFunction();
            })
            .ThrowsAsync(new VideoApiException("", 400, "", null, null));

            var response = await _serviceUnderTest.GetConferenceDetailsByHearingIdWithRetry(hearingId, "error message");
            
            _mocker.Mock<IPollyRetryService>().Verify(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
               (
                   It.IsAny<int>(), It.IsAny<Func<int, TimeSpan>>(), It.IsAny<Action<int>>(),
                   It.IsAny<Func<ConferenceDetailsResponse, bool>>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>()
               ), Times.AtLeastOnce);

            response.Should().BeEquivalentTo(expectedConferenceDetailsResponse);
        }
        
        [Test]
        public async Task Should_return_response_from_video_api_client()
        {
            Guid hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse();

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceByHearingRefIdAsync(hearingId, false))
                .ReturnsAsync(expectedConferenceDetailsResponse);
            
            var response = await _serviceUnderTest.GetConferenceDetailsByHearingId(hearingId);
            
            _mocker.Mock<IVideoApiClient>().Verify(x => x.GetConferenceByHearingRefIdAsync(hearingId, false), Times.Once);

            response.Should().BeEquivalentTo(expectedConferenceDetailsResponse);
        }
    }
}