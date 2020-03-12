using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Controllers;
using AdminWebsite.UserAPI.Client;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using AdminWebsite.Models;
using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace AdminWebsite.UnitTests.Controllers
{
    public class HealthTests
    {
        private HealthCheckController _controller;
        private Mock<IUserApiClient> _userApiClientMock;
        private Mock<IBookingsApiClient> _bookingsApiClientMock;

        [SetUp]
        public void Setup()
        {
            _userApiClientMock = new Mock<IUserApiClient>();
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();

            _controller = new HealthCheckController(_userApiClientMock.Object, _bookingsApiClientMock.Object);

            var judges = Builder<UserResponse>.CreateListOfSize(3).Build().ToList();
            _userApiClientMock.Setup(x => x.GetJudgesAsync())
                .ReturnsAsync(judges);
        }

        [Test]
        public async Task Should_return_internal_server_error_result_when_user_api_not_reachable()
        {
            var exception = new AggregateException("kinly api error");

            _userApiClientMock
                .Setup(x => x.GetJudgesAsync())
                .ThrowsAsync(exception);

            var result = await _controller.Health();
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.InternalServerError);
            var response = (HealthCheckResponse) typedResult.Value;
            response.UserApiHealth.Successful.Should().BeFalse();
            response.UserApiHealth.ErrorMessage.Should().NotBeNullOrWhiteSpace();
        }
        
        [Test]
        public async Task Should_return_internal_server_error_result_when_bookings_api_not_reachable()
        {
            var exception = new AggregateException("kinly api error");

            _bookingsApiClientMock
                .Setup(x => x.GetCaseTypesAsync())
                .ThrowsAsync(exception);

            var result = await _controller.Health();
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.InternalServerError);
            var response = (HealthCheckResponse) typedResult.Value;
            response.BookingsApiHealth.Successful.Should().BeFalse();
            response.BookingsApiHealth.ErrorMessage.Should().NotBeNullOrWhiteSpace();
        }
        
        [Test]
        public async Task Should_return_internal_server_error_result_when_non_video_api_exception_thrown()
        {
            var exception = new UriFormatException("Test format is invalid");

            _bookingsApiClientMock
                .Setup(x => x.GetCaseTypesAsync())
                .ThrowsAsync(exception);

            var result = await _controller.Health();
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.InternalServerError);
            var response = (HealthCheckResponse) typedResult.Value;
            response.BookingsApiHealth.Successful.Should().BeFalse();
            response.BookingsApiHealth.ErrorMessage.Should().NotBeNullOrWhiteSpace();
        }

        [Test]
        public async Task Should_return_ok_when_all_services_are_running()
        {
            var result = await _controller.Health();
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.OK);
            
            var response = (HealthCheckResponse) typedResult.Value;
            response.BookingsApiHealth.Successful.Should().BeTrue();
            response.UserApiHealth.Successful.Should().BeTrue();
        }

        [Test]
        public async Task should_return_the_application_version_from_assembly()
        {
            var result = await _controller.Health();
            var typedResult = (ObjectResult)result;
            var response = (HealthCheckResponse)typedResult.Value;
            response.AppVersion.FileVersion.Should().NotBeNullOrEmpty();
            response.AppVersion.InformationVersion.Should().NotBeNullOrEmpty();
        }
    }
}
