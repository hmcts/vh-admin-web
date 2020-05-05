using System;
using System.Threading.Tasks;
using AdminWebsite.Controllers;
using AdminWebsite.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers
{
    public class AudioPlatformControllerTests
    {
        private readonly Mock<ILogger<AudioPlatformController>> _logger;
        
        private readonly AudioPlatformController _controller;
        
        public AudioPlatformControllerTests()
        {
            _logger = new Mock<ILogger<AudioPlatformController>>();
            
            _controller = new AudioPlatformController(_logger.Object);    
        }
        
        [Test]
        public async Task Should_return_ok()
        {
            var result = await _controller.GetAudioRecordingLinkAsync(It.IsAny<Guid>());

            var actionResult = result as OkObjectResult;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(200);
            var item = actionResult.Value.As<HearingAudioRecordingResponse>();
            item.Should().NotBeNull().And.Subject.As<HearingAudioRecordingResponse>().AudioFileLink.Should().NotBeNullOrEmpty();
        }
    }
}