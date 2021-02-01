using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Controllers;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.VideoAPI.Client;
using HealthCheckResponse = AdminWebsite.Models.HealthCheckResponse;
using NotificationApi.Client;
using NotificationApi.Contract;
using Microsoft.Extensions.Logging;
using UserApi.Client;
using UserApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers
{
    public class HealthTests
    {
        private HealthCheckController _controller;
        private Mock<IUserApiClient> _userApiClientMock;
        private Mock<IBookingsApiClient> _bookingsApiClientMock;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<INotificationApiClient> _notificationApiClientMock;
        
        [SetUp]
        public void Setup()
        {
            _userApiClientMock = new Mock<IUserApiClient>();
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _notificationApiClientMock = new Mock<INotificationApiClient>();

            _controller = new HealthCheckController(_userApiClientMock.Object, _bookingsApiClientMock.Object, _videoApiClientMock.Object,
                                _notificationApiClientMock.Object, new Mock<ILogger<HealthCheckController>>().Object);

            var judges = Builder<UserResponse>.CreateListOfSize(3).Build().ToList();
            
            _userApiClientMock.Setup(x => x.GetJudgesAsync()).ReturnsAsync(judges);
        }

        [Test]
        public async Task Should_return_internal_server_error_result_when_user_api_not_reachable()
        {
            var exception = new AggregateException("kinly api error");

            _userApiClientMock
                .Setup(x => x.GetJudgesAsync())
                .ThrowsAsync(exception);

            var response = await GetResponseFromHealthCheck(HttpStatusCode.InternalServerError);
            response.UserApiHealth.Successful.Should().BeFalse();
            response.UserApiHealth.ErrorMessage.Should().NotBeNullOrWhiteSpace();
        }

        [Test]
        public async Task Should_return_user_api_exception_when_user_api_not_found()
        {
            var exception = new UserApiException("User api error", 404, "response", null, new Exception());

            _userApiClientMock
                .Setup(x => x.GetJudgesAsync())
                .ThrowsAsync(exception);

            var response = await GetResponseFromHealthCheck();
            response.UserApiHealth.Successful.Should().BeTrue();
            response.UserApiHealth.ErrorMessage.Should().BeNullOrWhiteSpace();
        }

        [Test]
        public async Task Should_return_internal_server_error_result_when_bookings_api_not_reachable()
        {
            var exception = new AggregateException("kinly api error");

            _bookingsApiClientMock
                .Setup(x => x.GetCaseTypesAsync())
                .ThrowsAsync(exception);

            var response = await GetResponseFromHealthCheck(HttpStatusCode.InternalServerError);
            response.BookingsApiHealth.Successful.Should().BeFalse();
            response.BookingsApiHealth.ErrorMessage.Should().NotBeNullOrWhiteSpace();
        }
        
        [Test]
        public async Task Should_return_internal_server_error_result_when_non_booking_api_exception_thrown()
        {
            var exception = new UriFormatException("Test format is invalid");

            _bookingsApiClientMock
                .Setup(x => x.GetCaseTypesAsync())
                .ThrowsAsync(exception);

            var response = await GetResponseFromHealthCheck(HttpStatusCode.InternalServerError);
            response.BookingsApiHealth.Successful.Should().BeFalse();
            response.BookingsApiHealth.ErrorMessage.Should().NotBeNullOrWhiteSpace();
        }

        [Test]
        public async Task Should_return_booking_api_exception_when_booking_api_not_found()
        {
            var exception = new BookingsApiException("Bookings api error", 404, "response", null, new Exception());

            _bookingsApiClientMock
                .Setup(x => x.GetCaseTypesAsync())
                .ThrowsAsync(exception);

            var response = await GetResponseFromHealthCheck();
            response.BookingsApiHealth.Successful.Should().BeTrue();
            response.BookingsApiHealth.ErrorMessage.Should().BeNullOrWhiteSpace();
        }

        [Test]
        public async Task Should_return_internal_server_error_result_when_video_api_not_reachable()
        {
            var exception = new AggregateException("kinly api error");

            _videoApiClientMock
                .Setup(x => x.GetExpiredOpenConferencesAsync())
                .ThrowsAsync(exception);

            var response = await GetResponseFromHealthCheck(HttpStatusCode.InternalServerError);
            response.VideoApiHealth.Successful.Should().BeFalse();
            response.VideoApiHealth.ErrorMessage.Should().NotBeNullOrWhiteSpace();
        }

        [Test]
        public async Task Should_return_video_api_exception_when_video_api_not_found()
        {
            var exception = new VideoApiException("Video api error", 404, "response", null, new Exception());

            _videoApiClientMock
                .Setup(x => x.GetExpiredOpenConferencesAsync())
                .ThrowsAsync(exception);

            var response = await GetResponseFromHealthCheck();
            response.VideoApiHealth.Successful.Should().BeTrue();
            response.VideoApiHealth.ErrorMessage.Should().BeNullOrWhiteSpace();
        }

        [Test]
        public async Task Should_return_internal_server_error_result_when_notification_api_not_reachable()
        {
            var exception = new AggregateException("Notification api error");

            _notificationApiClientMock
                .Setup(x => x.GetTemplateByNotificationTypeAsync(It.IsAny<NotificationType>()))
                .ThrowsAsync(exception);

            var response = await GetResponseFromHealthCheck(HttpStatusCode.InternalServerError);
            response.NotificationApiHealth.Successful.Should().BeFalse();
            response.NotificationApiHealth.ErrorMessage.Should().NotBeNullOrWhiteSpace();
        }

        [Test]
        public async Task Should_return_notifiy_exception_when_notification_api_not_found()
        {
            var exception = new NotificationApiException("Notification api error", 404, "response", null, new Exception());

            _notificationApiClientMock
                .Setup(x => x.GetTemplateByNotificationTypeAsync(It.IsAny<NotificationType>()))
                .ThrowsAsync(exception);

            var response = await GetResponseFromHealthCheck();
            response.NotificationApiHealth.Successful.Should().BeTrue();
            response.NotificationApiHealth.ErrorMessage.Should().BeNullOrWhiteSpace();
        }

        [Test]
        public async Task Should_return_ok_when_all_services_are_running()
        {
            var response = await GetResponseFromHealthCheck();
            response.BookingsApiHealth.Successful.Should().BeTrue();
            response.UserApiHealth.Successful.Should().BeTrue();
            response.VideoApiHealth.Successful.Should().BeTrue();
            response.NotificationApiHealth.Successful.Should().BeTrue();
        }

        [Test]
        public async Task Should_return_the_application_version_from_assembly()
        {
            var result = await _controller.Health();
            var typedResult = (ObjectResult)result;
            var response = (HealthCheckResponse)typedResult.Value;
            response.AppVersion.FileVersion.Should().NotBeNullOrEmpty();
            response.AppVersion.InformationVersion.Should().NotBeNullOrEmpty();
        }

        private async Task<HealthCheckResponse> GetResponseFromHealthCheck(HttpStatusCode expectedStatusCode = HttpStatusCode.OK)
        {
            var result = await _controller.Health();
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)expectedStatusCode);
            return (HealthCheckResponse)typedResult.Value;
        }
    }
}
