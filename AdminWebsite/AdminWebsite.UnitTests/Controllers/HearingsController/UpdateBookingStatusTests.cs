using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.VideoAPI.Client;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System;
using System.Threading.Tasks;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class UpdateBookingStatusTests
    {
        private readonly Mock<IBookingsApiClient> _bookingsApiClient;
        private readonly Mock<IUserIdentity> _userIdentity;
        private readonly AdminWebsite.Controllers.HearingsController _controller;
        private readonly Mock<IPollyRetryService> _pollyRetryServiceMock;

        public UpdateBookingStatusTests()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            var userAccountService = new Mock<IUserAccountService>();
            var editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();
            var videoApiMock = new Mock<IVideoApiClient>();
            _pollyRetryServiceMock = new Mock<IPollyRetryService>();

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                userAccountService.Object,
                editHearingRequestValidator.Object,
                videoApiMock.Object,
                _pollyRetryServiceMock.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_success_response_when_status_not_cancelled()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("test");
            var request = new UpdateBookingStatusRequest
            {
                Updated_by = "test", Cancel_reason = "", Status = UpdateBookingStatus.Cancelled
            };
            var hearingId = Guid.NewGuid();

            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, request));

            var response = await _controller.UpdateBookingStatus(hearingId, request);

            var result = (OkObjectResult) response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeTrue();

            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, request), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_success_response_when_status_not_failed()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("test");
            var request = new UpdateBookingStatusRequest
            {
                Updated_by = "test", Cancel_reason = "", Status = UpdateBookingStatus.Failed
            };
            var hearingId = Guid.NewGuid();

            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, request));

            var response = await _controller.UpdateBookingStatus(hearingId, request);

            var result = (OkObjectResult) response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeTrue();

            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, request), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_success_response_when_conference_exists_with_meeting_room()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("test");
            var request = new UpdateBookingStatusRequest
            {
                Updated_by = "test", Cancel_reason = "", Status = UpdateBookingStatus.Created
            };
            var hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(), Hearing_id = hearingId, Meeting_room = new MeetingRoomResponse
                {
                    Admin_uri = "admin", Judge_uri = "judge", Participant_uri = "participant", Pexip_node = "pexip"
                }
            };

            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, request));
            _pollyRetryServiceMock.Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
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

            var response = await _controller.UpdateBookingStatus(hearingId, request);

            var result = (OkObjectResult) response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeTrue();

            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, request), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_false_response_when_video_api_throws()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("test");
            var updateCreatedStatus = new UpdateBookingStatusRequest
            {
                Updated_by = "test", Cancel_reason = "", Status = UpdateBookingStatus.Created
            };

            var hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(), Hearing_id = hearingId, Meeting_room = new MeetingRoomResponse
                {
                    Admin_uri = "admin", Judge_uri = "judge", Participant_uri = "participant", Pexip_node = "pexip"
                }
            };

            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus));
            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, It.IsAny<UpdateBookingStatusRequest>()));

            _pollyRetryServiceMock.Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
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
                .ThrowsAsync(new VideoApiException("", 0, "", null, null));

            var response = await _controller.UpdateBookingStatus(hearingId, updateCreatedStatus);

            var result = (OkObjectResult) response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeFalse();

            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(pred => pred.Status == UpdateBookingStatus.Failed)), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_false_response_when_conference_exists_but_meeting_null()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("test");
            var updateCreatedStatus = new UpdateBookingStatusRequest
            {
                Updated_by = "test", Cancel_reason = "", Status = UpdateBookingStatus.Created
            };

            var hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(), Hearing_id = hearingId
            };

            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus));
            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, It.IsAny<UpdateBookingStatusRequest>()));

            _pollyRetryServiceMock.Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
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
                .ThrowsAsync(new VideoApiException("", 0, "", null, null));

            var response = await _controller.UpdateBookingStatus(hearingId, updateCreatedStatus);

            var result = (OkObjectResult) response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeFalse();

            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(pred => pred.Status == UpdateBookingStatus.Failed)), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_false_response_when_conference_exists_but_admin_uri_null()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("test");
            var updateCreatedStatus = new UpdateBookingStatusRequest
            {
                Updated_by = "test", Cancel_reason = "", Status = UpdateBookingStatus.Created
            };

            var hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(), Hearing_id = hearingId, Meeting_room = new MeetingRoomResponse
                {
                    Judge_uri = "judge", Participant_uri = "participant", Pexip_node = "pexip"
                }
            };

            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus));
            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, It.IsAny<UpdateBookingStatusRequest>()));

            _pollyRetryServiceMock.Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
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
                .ThrowsAsync(new VideoApiException("", 0, "", null, null));

            var response = await _controller.UpdateBookingStatus(hearingId, updateCreatedStatus);

            var result = (OkObjectResult) response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeFalse();

            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(pred => pred.Status == UpdateBookingStatus.Failed)), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_false_response_when_conference_exists_but_participant_uri_null()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("test");
            var updateCreatedStatus = new UpdateBookingStatusRequest
            {
                Updated_by = "test", Cancel_reason = "", Status = UpdateBookingStatus.Created
            };

            var hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(), Hearing_id = hearingId, Meeting_room = new MeetingRoomResponse
                {
                    Admin_uri = "admin", Judge_uri = "judge", Pexip_node = "pexip"
                }
            };

            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus));
            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, It.IsAny<UpdateBookingStatusRequest>()));

            _pollyRetryServiceMock.Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
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
                .ThrowsAsync(new VideoApiException("", 0, "", null, null));

            var response = await _controller.UpdateBookingStatus(hearingId, updateCreatedStatus);

            var result = (OkObjectResult) response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeFalse();

            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(pred => pred.Status == UpdateBookingStatus.Failed)), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_false_response_when_conference_exists_but_judge_uri_null()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("test");
            var updateCreatedStatus = new UpdateBookingStatusRequest
            {
                Updated_by = "test", Cancel_reason = "", Status = UpdateBookingStatus.Created
            };

            var hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(), Hearing_id = hearingId, Meeting_room = new MeetingRoomResponse
                {
                    Admin_uri = "admin", Participant_uri = "participant", Pexip_node = "pexip"
                }
            };

            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus));
            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, It.IsAny<UpdateBookingStatusRequest>()));

            _pollyRetryServiceMock.Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
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
                .ThrowsAsync(new VideoApiException("", 0, "", null, null));

            var response = await _controller.UpdateBookingStatus(hearingId, updateCreatedStatus);

            var result = (OkObjectResult) response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeFalse();

            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(pred => pred.Status == UpdateBookingStatus.Failed)), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_false_response_when_conference_exists_but_pexip_node_null()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("test");
            var updateCreatedStatus = new UpdateBookingStatusRequest
            {
                Updated_by = "test", Cancel_reason = "", Status = UpdateBookingStatus.Created
            };

            var hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(), Hearing_id = hearingId, Meeting_room = new MeetingRoomResponse
                {
                    Admin_uri = "admin", Judge_uri = "judge", Participant_uri = "participant"
                }
            };

            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus));
            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, It.IsAny<UpdateBookingStatusRequest>()));

            _pollyRetryServiceMock.Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
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
                .ThrowsAsync(new VideoApiException("", 0, "", null, null));

            var response = await _controller.UpdateBookingStatus(hearingId, updateCreatedStatus);

            var result = (OkObjectResult) response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeFalse();

            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus), Times.Once);
            _bookingsApiClient.Verify(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(pred => pred.Status == UpdateBookingStatus.Failed)), Times.Once);
        }

        [Test]
        public void UpdateBookingStatus_throws_when_bookings_api_exception()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("test");
            var request = new UpdateBookingStatusRequest
            {
                Updated_by = "test", Cancel_reason = "", Status = UpdateBookingStatus.Cancelled
            };
            
            var hearingId = Guid.NewGuid();

            _bookingsApiClient.Setup(x => x.UpdateBookingStatusAsync(hearingId, request))
                .ThrowsAsync(new BookingsApiException("", StatusCodes.Status500InternalServerError, "", null, null));

            Assert.ThrowsAsync<BookingsApiException>(() => _controller.UpdateBookingStatus(hearingId, request));
        }
    }
}