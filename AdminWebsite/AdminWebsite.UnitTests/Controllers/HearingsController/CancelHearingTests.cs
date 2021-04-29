using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NotificationApi.Client;
using NUnit.Framework;
using System;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Requests.Enums;
using VideoApi.Client;
using Microsoft.Extensions.Options;
using AdminWebsite.Configuration;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class CancelHearingTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IUserAccountService> _userAccountService;
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;
        private AdminWebsite.Controllers.HearingsController _controller;
        private Guid _guid;
        private UpdateBookingStatusRequest _updateBookingStatusRequest;
        private Mock<IVideoApiClient> _videoApiMock;
        private Mock<IPollyRetryService> _pollyRetryServiceMock;
        private Mock<INotificationApiClient> _notificationApiMock;
        private Mock<ILogger<HearingsService>> _participantGroupLogger;
        private Mock<IOptions<KinlyConfiguration>> _kinlyOptionsMock;
        private Mock<KinlyConfiguration> _kinlyConfigurationMock;
        private Mock<IConferenceDetailsService> _conferencesServiceMock;

        private IHearingsService _hearingsService;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userAccountService = new Mock<IUserAccountService>();
            _editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();
            _videoApiMock = new Mock<IVideoApiClient>();
            _pollyRetryServiceMock = new Mock<IPollyRetryService>();
            _notificationApiMock = new Mock<INotificationApiClient>();
            _conferencesServiceMock = new Mock<IConferenceDetailsService>();

            _kinlyOptionsMock = new Mock<IOptions<KinlyConfiguration>>();
            _kinlyConfigurationMock = new Mock<KinlyConfiguration>();
            _kinlyOptionsMock.Setup((op) => op.Value).Returns(_kinlyConfigurationMock.Object);

            _participantGroupLogger = new Mock<ILogger<HearingsService>>();
            _hearingsService = new HearingsService(_pollyRetryServiceMock.Object,
                _userAccountService.Object, _notificationApiMock.Object,
                _bookingsApiClient.Object, _participantGroupLogger.Object, _conferencesServiceMock.Object, _kinlyOptionsMock.Object);

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _userAccountService.Object,
                _editHearingRequestValidator.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object,
                _hearingsService,
                _conferencesServiceMock.Object,
                Mock.Of<IPublicHolidayRetriever>());

            _guid = Guid.NewGuid();

            _updateBookingStatusRequest = new UpdateBookingStatusRequest()
                {Status = UpdateBookingStatus.Cancelled, UpdatedBy = "admin user"};
        }

        [Test]
        public async Task Should_update_status_of_hearing_to_cancelled_given_status_and_updatedby()
        {
            var response = await _controller.UpdateBookingStatus(_guid, _updateBookingStatusRequest);
            var result = (OkObjectResult) response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should()
                .BeTrue();
        }
    }
}
