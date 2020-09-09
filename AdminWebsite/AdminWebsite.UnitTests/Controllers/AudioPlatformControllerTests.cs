using System;
using System.Threading.Tasks;
using AdminWebsite.Controllers;
using AdminWebsite.Models;
using AdminWebsite.VideoAPI.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;

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
            var audioResponse = new AudioRecordingResponse
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

        [Test]
        public async Task Should_get_cvp_audio_file_return_ok()
        {
            //var audioResponse = new CvpAudioFileResponse
            //{
            //    FileName = "someFile",
            //    SasTokenUri="someLink"
            //};

          //  _videoApiClientMock.Setup(x => x.GetAudioRecordingLinkAsync(It.IsAny<Guid>())).ReturnsAsync(audioResponse);

            var result = _controller.GetCvpAudioRecordingLinkAsync(It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<string>());

            var actionResult = result as OkObjectResult;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(200);
            var item = actionResult.Value.As<CvpAudioFileResponse>();
            item.Should().NotBeNull()
                .And.Subject.As<CvpAudioFileResponse>().FileName.Should().NotBeNullOrEmpty()
                .And.Subject.As<CvpAudioFileResponse>().SasTokenUri.Should().NotBeNullOrEmpty();
        }

        [Test]
        public async Task Should_return_bad_request_for_cvp_audio_file()
        {
            _videoApiClientMock
                .Setup(x => x.GetAudioRecordingLinkAsync(It.IsAny<Guid>()))
                .ThrowsAsync(new VideoApiException("bad request", StatusCodes.Status400BadRequest, "", null, null));

            var result = _controller.GetCvpAudioRecordingLinkAsync(It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<string>());

            var actionResult = result as ObjectResult;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(400);
        }
    }
}
