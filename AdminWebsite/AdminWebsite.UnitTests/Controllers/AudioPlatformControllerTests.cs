﻿using System.Threading.Tasks;
using AdminWebsite.Controllers;
using AdminWebsite.Models;
using BookingsApi.Client;
using BookingsApi.Contract.V2.Responses;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using VideoApi.Client;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers
{
    public class AudioPlatformControllerTests
    {
        private readonly Mock<IVideoApiClient> _videoApiClientMock;

        private readonly AudioPlatformController _controller;
        
        private readonly Mock<IBookingsApiClient> _bookingsApiClientMock;
        private readonly Mock<ILogger<AudioPlatformController>> _loggerMock;

        public AudioPlatformControllerTests()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _loggerMock = new Mock<ILogger<AudioPlatformController>>();

            _controller = new AudioPlatformController(_videoApiClientMock.Object, _loggerMock.Object, _bookingsApiClientMock.Object);
        }

        [Test]
        public async Task Should_return_ok()
        {
            var audioResponse = new AudioRecordingResponse
            {
                AudioFileLinks = new List<string> { "someLinkToFile" }
            };

            _videoApiClientMock.Setup(x => x.GetAudioRecordingLinkAsync(It.IsAny<string>())).ReturnsAsync(audioResponse);
            
            var result = await _controller.GetAudioRecordingLinkAsync(It.IsAny<Guid>());

            var actionResult = result as OkObjectResult;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(200);
            var item = actionResult.Value.As<HearingAudioRecordingResponse>();
            item.Should().NotBeNull()
                .And.Subject.As<HearingAudioRecordingResponse>().AudioFileLinks.Count.Should().Be(1);
            item.AudioFileLinks[0].Should().Be(audioResponse.AudioFileLinks[0]);
        }
        
        [Test]
        public async Task Should_return_hrs_file_format()
        {
            var audioResponse = new AudioRecordingResponse
            {
                AudioFileLinks = new List<string> { "someLinkToFile" }
            };

            var hearing = new HearingDetailsResponseV2()
            {
                ServiceId = "AAA",
                Cases = new List<CaseResponseV2>
                {
                    new CaseResponseV2() {Number = "Case Number"}
                }
            };

            _videoApiClientMock.Setup(x => x.GetAudioRecordingLinkAsync(It.IsAny<string>())).ReturnsAsync(audioResponse);
            _bookingsApiClientMock.Setup(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>())).ReturnsAsync(hearing);

            var result = await _controller.GetAudioRecordingLinkAsync(It.IsAny<Guid>());

            var actionResult = result as OkObjectResult;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(200);
            var item = actionResult.Value.As<HearingAudioRecordingResponse>();
            item.Should().NotBeNull()
                .And.Subject.As<HearingAudioRecordingResponse>().AudioFileLinks.Count.Should().Be(1);
            item.AudioFileLinks[0].Should().Be(audioResponse.AudioFileLinks[0]);
        }

        [Test]
        public async Task Should_return_not_found()
        {
            _videoApiClientMock
                .Setup(x => x.GetAudioRecordingLinkAsync(It.IsAny<string>()))
                .ThrowsAsync(new VideoApiException("not found", StatusCodes.Status404NotFound, "", null, null));

            var result = await _controller.GetAudioRecordingLinkAsync(It.IsAny<Guid>());

            var actionResult = result as ObjectResult;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(404);
        }

        [Test]
        public async Task Should_get_cvp_audio_file_for_cloudroom_and_date_return_ok()
        {
            var audioResponse = new List<CvpAudioFileResponse>{ new CvpAudioFileResponse
            {
                FileName = "someFile",
                SasTokenUrl = "someLink"
            } };

            _videoApiClientMock.Setup(x => x.GetAudioRecordingLinkCvpByCloudRoomAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(audioResponse);

            var result = await _controller.GetCvpAudioRecordingsByCloudRoomAsync(It.IsAny<string>(), It.IsAny<string>());

            var actionResult = result as OkObjectResult;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(200);
            var item = actionResult.Value.As<List<CvpForAudioFileResponse>>();
            item.Should().NotBeNull()
                .And.Subject.As<List<CvpForAudioFileResponse>>().Count.Should().Be(1);
            item[0].FileName.Should().Be("someFile");
            item[0].SasTokenUri.Should().Be("someLink");
        }

        [Test]
        public async Task Should_get_cvp_audio_file_for_date_and_case_reference_return_ok()
        {
            var audioResponse = new List<CvpAudioFileResponse>
            {
                new CvpAudioFileResponse
                {
                    FileName = "someFile",
                    SasTokenUrl = "someLink"
                }
            };

            _videoApiClientMock.Setup(x => x.GetAudioRecordingLinkCvpByDateAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(audioResponse);

            var result = await _controller.GetCvpAudioRecordingsByDateAsync(It.IsAny<string>(), It.IsAny<string>());

            var actionResult = result as OkObjectResult;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(200);
            var item = actionResult.Value.As<List<CvpForAudioFileResponse>>();
            item.Should().NotBeNull()
                .And.Subject.As<List<CvpForAudioFileResponse>>().Count.Should().Be(1);
            item[0].FileName.Should().Be("someFile");
            item[0].SasTokenUri.Should().Be("someLink");
        }

        [Test]
        public async Task Should_get_cvp_audio_file_for_cloudroom_and_date_and_caseReference_return_ok()
        {
            var audioResponse = new List<CvpAudioFileResponse>{ new CvpAudioFileResponse
            {
                FileName = "someFile",
                SasTokenUrl = "someLink"
            } };

            _videoApiClientMock.Setup(x => x.GetAudioRecordingLinkAllCvpAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(audioResponse);

            var result = await _controller.GetCvpAudioRecordingsALlLinkAsync(It.IsAny<string>(), It.IsAny<string>(), "case ref");

            var actionResult = result as OkObjectResult;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(200);
            var item = actionResult.Value.As<List<CvpForAudioFileResponse>>();
            item.Should().NotBeNull()
                .And.Subject.As<List<CvpForAudioFileResponse>>().Count.Should().Be(1);
            item[0].FileName.Should().Be("someFile");
            item[0].SasTokenUri.Should().Be("someLink");
        }

        [Test]
        public async Task Should_return_bad_request_for_cvp_audio_file()
        {
            _videoApiClientMock.Setup(x => x.GetAudioRecordingLinkCvpByCloudRoomAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new VideoApiException("not found request", StatusCodes.Status404NotFound, "", null, null));

            var result = await _controller.GetCvpAudioRecordingsByCloudRoomAsync(It.IsAny<string>(), It.IsAny<string>());

            var actionResult = result as ObjectResult;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(404);
        }

        [Test]
        public async Task Should_return_bad_request_for_cvp_audio_file_with_case_reference()
        {
            _videoApiClientMock.Setup(x => x.GetAudioRecordingLinkAllCvpAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new VideoApiException("not found request", StatusCodes.Status404NotFound, "", null, null));

            var result = await _controller.GetCvpAudioRecordingsALlLinkAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>());

            var actionResult = result as ObjectResult;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(404);
        }

        [Test]
        public async Task Should_return_bad_request_for_cvp_audio_file_by_date()
        {
            _videoApiClientMock.Setup(x => x.GetAudioRecordingLinkCvpByDateAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new VideoApiException("not found request", StatusCodes.Status404NotFound, "", null, null));

            var result = await _controller.GetCvpAudioRecordingsByDateAsync(It.IsAny<string>(), It.IsAny<string>());

            var actionResult = result as ObjectResult;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(404);
        }
    }
}
