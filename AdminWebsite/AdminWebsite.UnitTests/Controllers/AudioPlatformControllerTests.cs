using System;
using System.Threading.Tasks;
using AdminWebsite.Controllers;
using AdminWebsite.VideoAPI.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using HearingAudioRecordingResponse = AdminWebsite.Models.HearingAudioRecordingResponse;

namespace AdminWebsite.UnitTests.Controllers
{
    public class AudioPlatformControllerTests
    {
        private readonly Mock<IVideoApiClient> _videoApiClientMock;

        private readonly AudioPlatformController _controller;
        
        public AudioPlatformControllerTests()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();

            _controller = new AudioPlatformController(_videoApiClientMock.Object, new Mock<ILogger<AudioPlatformController>>().Object);    
        }
        
        [Test]
        public async Task Should_return_ok()
        {
            var audioResponse = new AdminWebsite.VideoAPI.Client.HearingAudioRecordingResponse
            {
                Audio_file_link = "someLinkToFile"
            };

            _videoApiClientMock.Setup(x => x.GetAudioRecordingLinkAsync(It.IsAny<Guid>())).ReturnsAsync(audioResponse);
            
            var result = await _controller.GetAudioRecordingLinkAsync(It.IsAny<Guid>());

            var actionResult = result as OkObjectResult;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(200);
            var item = actionResult.Value.As<HearingAudioRecordingResponse>();
            item.Should().NotBeNull()
                .And.Subject.As<HearingAudioRecordingResponse>().AudioFileLink.Should().NotBeNullOrEmpty()
                .And.Subject.Should().Be(audioResponse.Audio_file_link);
        }
        
        [Test]
        public async Task Should_return_not_found()
        {
            _videoApiClientMock
                .Setup(x => x.GetAudioRecordingLinkAsync(It.IsAny<Guid>()))
                .ThrowsAsync(new VideoApiException("not found", StatusCodes.Status404NotFound, "", null, null));
            
            var result = await _controller.GetAudioRecordingLinkAsync(It.IsAny<Guid>());

            var actionResult = result as ObjectResult;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(404);
        }
    }
}