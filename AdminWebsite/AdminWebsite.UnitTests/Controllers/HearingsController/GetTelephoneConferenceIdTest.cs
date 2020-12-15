using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.VideoAPI.Client;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NotificationApi.Client;
using NUnit.Framework;
using System;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class GetTelephoneConferenceIdTest
    {
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IUserAccountService> _userAccountService;
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;
        private Mock<IVideoApiClient> _videoApiMock;
        private Mock<IPollyRetryService> _pollyRetryServiceMock;
        private Mock<INotificationApiClient> _notificationApiMock;

        private AdminWebsite.Controllers.HearingsController _controller;
        private ConferenceDetailsResponse _conference;
        private readonly Guid _guid = Guid.NewGuid();

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

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _userAccountService.Object,
                _editHearingRequestValidator.Object,
                _videoApiMock.Object,
                _pollyRetryServiceMock.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object,
                _notificationApiMock.Object);

            _conference = new ConferenceDetailsResponse
            {
                Meeting_room = new MeetingRoomResponse
                {
                    Telephone_conference_id = "454545",
                    Admin_uri = "uri",
                    Judge_uri = "uri",
                    Participant_uri = "uri",
                    Pexip_node = "node"
                }
            };
        }

        [Test]
        public void Should_return_ok_status_and_telephone_conference_id_if_hearing_is_confirmed()
        {
            _videoApiMock.Setup(x => x.GetConferenceByHearingRefIdAsync(It.IsAny<Guid>())).ReturnsAsync(_conference);

            var result = _controller.GetTelephoneConferenceIdById(_guid);
            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().Be(200);

            var phoneDetails = (PhoneConferenceResponse)((OkObjectResult)result.Result).Value;
            phoneDetails.TelephoneConferenceId.Should().Be(_conference.Meeting_room.Telephone_conference_id);
        }

        [Test]
        public void Should_return_not_found_if_no_meeting_room_exists()
        {
            _conference.Meeting_room.Pexip_node = null;
            _videoApiMock.Setup(x => x.GetConferenceByHearingRefIdAsync(It.IsAny<Guid>())).ReturnsAsync(_conference);

            var result = _controller.GetTelephoneConferenceIdById(_guid);
            var okRequestResult = (NotFoundResult)result.Result;
            okRequestResult.StatusCode.Should().Be(404);
        }

        [Test]
        public void Should_return_bad_reguest_if_exeptions_is_thrown()
        {
            _videoApiMock.Setup(x => x.GetConferenceByHearingRefIdAsync(It.IsAny<Guid>()))
                .Throws(new VideoApiException("Error", 400, null, null, null));

            var result = _controller.GetTelephoneConferenceIdById(_guid);
            var okRequestResult = (BadRequestObjectResult)result.Result;
            okRequestResult.StatusCode.Should().Be(400);
        }

        [Test]
        public void Should_return_not_found_if_exeptions_is_thrown()
        {
            _videoApiMock.Setup(x => x.GetConferenceByHearingRefIdAsync(It.IsAny<Guid>()))
                .Throws(new VideoApiException("Error", 404, null, null, null));

            var result = _controller.GetTelephoneConferenceIdById(_guid);
            var okRequestResult = (NotFoundResult)result.Result;
            okRequestResult.StatusCode.Should().Be(404);
        }
    }
}
