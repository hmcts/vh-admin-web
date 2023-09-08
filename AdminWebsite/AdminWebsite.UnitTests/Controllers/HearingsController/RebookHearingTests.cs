using System;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.UnitTests.Helper;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class RebookHearingTests
    {
        private AutoMock _mocker;
        private AdminWebsite.Controllers.HearingsController _controller;
        
        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _controller = _mocker.Create<AdminWebsite.Controllers.HearingsController>();
        }
        
        [Test]
        public async Task Should_return_no_content_when_successful()
        {
            var hearingId = Guid.NewGuid();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.RebookHearingAsync(hearingId))
                .Verifiable();

            var response = await _controller.RebookHearing(hearingId);

            response.Should().BeOfType<NoContentResult>();
            _mocker.Mock<IBookingsApiClient>()
                .Verify(x => x.RebookHearingAsync(hearingId),
                Times.Once());

        }

        [Test]
        public async Task Should_pass_not_found_from_bookings_api()
        {
            var hearingId = Guid.NewGuid();
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.RebookHearingAsync(hearingId))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.NotFound));
            
            var response = await _controller.RebookHearing(hearingId);

            response.Should().BeOfType<NotFoundObjectResult>();
        }

        [Test]
        public async Task Should_pass_bad_request_from_bookings_api()
        {
            var hearingId = Guid.NewGuid();
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.RebookHearingAsync(hearingId))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));
            
            var response = await _controller.RebookHearing(hearingId);

            response.Should().BeOfType<BadRequestObjectResult>();
        }
    }
}
