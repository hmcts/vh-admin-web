using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Extensions;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helpers;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Requests.Enums;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using NotificationApi.Client;
using NotificationApi.Contract;
using NotificationApi.Contract.Requests;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class UpdateBookingStatusTests
    {
        private AutoMock _mocker;
        private AdminWebsite.Controllers.HearingsController _controller;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();

            _mocker.Mock<IConferenceDetailsService>().Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>()))
                .ReturnsAsync(new ConferenceDetailsResponse
                {
                    MeetingRoom = new MeetingRoomResponse
                    {
                        AdminUri = "AdminUri",
                        JudgeUri = "JudgeUri",
                        ParticipantUri = "ParticipantUri",
                        PexipNode = "PexipNode",
                        PexipSelfTestNode = "PexipSelfTestNode",
                        TelephoneConferenceId = "expected_conference_phone_id"
                    }
                });

            _controller = _mocker.Create<AdminWebsite.Controllers.HearingsController>();
        }

        [Test]
        public async Task UpdateBookingStatus_returns_success_response_when_status_not_cancelled()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var request = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Cancelled
            };
            var hearingId = Guid.NewGuid();

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, request));

            var response = await _controller.UpdateBookingStatus(hearingId, request);

            var result = (OkObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeTrue();

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, request), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_success_response_when_status_not_failed()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var request = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Failed
            };
            var hearingId = Guid.NewGuid();

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, request));

            var response = await _controller.UpdateBookingStatus(hearingId, request);

            var result = (OkObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeTrue();

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, request), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_success_response_when_conference_exists_with_meeting_room_and_send_reminder_email()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var request = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Created
            };
            var hearingId = Guid.NewGuid();
            var hearing = InitBookingForResponse(hearingId);
            hearing.OtherInformation = new OtherInformationDetails
            {
                JudgeEmail = "judge@hmcts.net",
                JudgePhone = "12345789",
                OtherInformation = "info"
            }.ToOtherInformationString();

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(hearing);

            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(),
                HearingId = hearingId,
                MeetingRoom = new MeetingRoomResponse
                {
                    AdminUri = "admin",
                    JudgeUri = "judge",
                    ParticipantUri = "participant",
                    PexipNode = "pexip",
                    TelephoneConferenceId = "121212"
                }
            };

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, request));
            _mocker.Mock<IConferenceDetailsService>()
                .Setup(x => x.GetConferenceDetailsByHearingIdWithRetry(It.IsAny<Guid>(), It.IsAny<string>()))
                .ReturnsAsync(expectedConferenceDetailsResponse);
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingsByGroupIdAsync(hearing.GroupId.Value)).ReturnsAsync(new List<HearingDetailsResponse> { hearing });

            var response = await _controller.UpdateBookingStatus(hearingId, request);

            var result = (OkObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeTrue();
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.TelephoneConferenceId.Should().Be("121212");

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, request), Times.Once);

            _mocker.Mock<IHearingsService>().Verify(
                x => x.SendHearingReminderEmail(It.Is<HearingDetailsResponse>(x => x == hearing)), Times.AtLeast(1));
        }

        [Test]
        public async Task UpdateBookingStatus_returns_false_response_when_video_api_throws()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var updateCreatedStatus = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Created
            };

            var hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(),
                HearingId = hearingId,
                MeetingRoom = new MeetingRoomResponse
                {
                    AdminUri = "admin",
                    JudgeUri = "judge",
                    ParticipantUri = "participant",
                    PexipNode = "pexip"
                }
            };

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus));
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, It.IsAny<UpdateBookingStatusRequest>()));

            _mocker.Mock<IPollyRetryService>().Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
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

            var result = (OkObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeFalse();

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus), Times.Once);
            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(pred => pred.Status == UpdateBookingStatus.Failed)), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_false_response_when_conference_exists_but_meeting_null()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var updateCreatedStatus = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Created
            };

            var hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(),
                HearingId = hearingId
            };

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus));
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, It.IsAny<UpdateBookingStatusRequest>()));

            _mocker.Mock<IPollyRetryService>().Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
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

            var result = (OkObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeFalse();

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus), Times.Once);
            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(pred => pred.Status == UpdateBookingStatus.Failed)), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_false_response_when_conference_exists_but_admin_uri_null()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var updateCreatedStatus = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Created
            };

            var hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(),
                HearingId = hearingId,
                MeetingRoom = new MeetingRoomResponse
                {
                    JudgeUri = "judge",
                    ParticipantUri = "participant",
                    PexipNode = "pexip"
                }
            };

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus));
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, It.IsAny<UpdateBookingStatusRequest>()));

            _mocker.Mock<IConferenceDetailsService>().Setup(x => x.GetConferenceDetailsByHearingIdWithRetry(It.IsAny<Guid>(), It.IsAny<string>()))
                                    .ThrowsAsync(new VideoApiException("", 0, "", null, null));

            var response = await _controller.UpdateBookingStatus(hearingId, updateCreatedStatus);

            var result = (OkObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            var updateBookingStatusResp = (UpdateBookingStatusResponse)result.Value;
            updateBookingStatusResp.Should().NotBeNull();
            updateBookingStatusResp.Success.Should().BeFalse();
            updateBookingStatusResp.Message.Should().Be($"Failed to get the conference from video api, possibly the conference was not created or the kinly meeting room is null - hearingId: {hearingId}");

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus), Times.Once);
            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(b => b.Status == UpdateBookingStatus.Failed
                                                                                                                     && b.UpdatedBy == "System"
                                                                                                                     && b.CancelReason == string.Empty
                                                                                                                                )), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_false_response_when_conference_exists_but_participant_uri_null()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var updateCreatedStatus = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Created
            };

            var hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(),
                HearingId = hearingId,
                MeetingRoom = new MeetingRoomResponse
                {
                    AdminUri = "admin",
                    JudgeUri = "judge",
                    PexipNode = "pexip"
                }
            };

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus));
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, It.IsAny<UpdateBookingStatusRequest>()));

            _mocker.Mock<IPollyRetryService>().Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
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

            var result = (OkObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeFalse();

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus), Times.Once);
            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(pred => pred.Status == UpdateBookingStatus.Failed)), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_false_response_when_conference_exists_but_judge_uri_null()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var updateCreatedStatus = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Created
            };

            var hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(),
                HearingId = hearingId,
                MeetingRoom = new MeetingRoomResponse
                {
                    AdminUri = "admin",
                    ParticipantUri = "participant",
                    PexipNode = "pexip"
                }
            };

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus));
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, It.IsAny<UpdateBookingStatusRequest>()));

            _mocker.Mock<IPollyRetryService>().Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
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

            var result = (OkObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeFalse();

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus), Times.Once);
            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(pred => pred.Status == UpdateBookingStatus.Failed)), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_false_response_when_conference_exists_but_pexip_node_null()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var updateCreatedStatus = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Created
            };

            var hearingId = Guid.NewGuid();
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(),
                HearingId = hearingId,
                MeetingRoom = new MeetingRoomResponse
                {
                    AdminUri = "admin",
                    JudgeUri = "judge",
                    ParticipantUri = "participant"
                }
            };

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus));
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, It.IsAny<UpdateBookingStatusRequest>()));

            _mocker.Mock<IPollyRetryService>().Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
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

            var result = (OkObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeFalse();

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus), Times.Once);
            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(pred => pred.Status == UpdateBookingStatus.Failed)), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_for_create_returns_failed_booking_status_in_response_when_there_is_nornal_exception()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var updateCreatedStatus = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Created
            };

            var hearingId = Guid.NewGuid();

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus));
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(request => request.Status != UpdateBookingStatus.Failed)))
                .ThrowsAsync(new Exception("test exception"));

            var response = await _controller.UpdateBookingStatus(hearingId, updateCreatedStatus);

            var result = (OkObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeFalse();

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus), Times.Once);
            _mocker.Mock<IBookingsApiClient>().Verify(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(pred => pred.Status == UpdateBookingStatus.Failed)), Times.Once);
        }

        [Test]
        public async Task UpdateBookingStatus_returns_failed_status_response_when_there_is_argument_exception()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var updateCreatedStatus = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Cancelled
            };

            var hearingId = Guid.NewGuid();

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, updateCreatedStatus));
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, It.Is<UpdateBookingStatusRequest>(request => request.Status == UpdateBookingStatus.Cancelled)))
                .ThrowsAsync(new ArgumentException("test argument exception"));

            var response = await _controller.UpdateBookingStatus(hearingId, updateCreatedStatus);

            var result = (BadRequestObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        }

        [Test]
        public async Task UpdateBookingStatus_with_cancellation_returns_bad_request_when_throws_bookings_api_exception_internalerror()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var request = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Cancelled
            };

            var hearingId = Guid.NewGuid();

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, request))
                .ThrowsAsync(new BookingsApiException("", StatusCodes.Status500InternalServerError, "", null, null));

            var response = await _controller.UpdateBookingStatus(hearingId, request);

            var result = (BadRequestObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
            
        }

        [Test]
        public async Task UpdateBookingStatus_with_cancellation_returns_not_found_when_throws_bookings_api_exception_of_status_code_not_found()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var request = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Cancelled
            };

            var hearingId = Guid.NewGuid();

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, request))
                .ThrowsAsync(new BookingsApiException("", StatusCodes.Status404NotFound, "", null, null));

            var response = await _controller.UpdateBookingStatus(hearingId, request);

            var result = (NotFoundObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status404NotFound);

        }

        [Test]
        public async Task UpdateBookingStatus_with_cancellation_returns_bad_request_when_throws_bookings_api_exception_badrequest()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var request = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Cancelled
            };

            var hearingId = Guid.NewGuid();

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, request))
                .ThrowsAsync(new BookingsApiException("", StatusCodes.Status400BadRequest, "", null, null));

            var response = await _controller.UpdateBookingStatus(hearingId, request);

            var result = (BadRequestObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        }

        public async Task UpdateBookingStatus_with_cancellation_returns_bad_request_when_throws_exception()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var request = new UpdateBookingStatusRequest
            {
                UpdatedBy = "test",
                CancelReason = "",
                Status = UpdateBookingStatus.Cancelled
            };

            var hearingId = Guid.NewGuid();

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(hearingId, request))
                .ThrowsAsync(new Exception("Booking cancellation test exception."));

            var response = await _controller.UpdateBookingStatus(hearingId, request);

            var result = (BadRequestObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        }

        private HearingDetailsResponse InitBookingForResponse(Guid hearingId)
        {
            var hearing = HearingResponseBuilder.Build()
                .WithParticipant("Representative", "username1@hmcts.net")
                .WithParticipant("Individual", "fname2.lname2@hmcts.net")
                .WithParticipant("Judicial Office Holder", "fname3.lname3@hmcts.net")
                .WithParticipant("Judge", "judge.fudge@hmcts.net");
            hearing.Id = hearingId;
            hearing.GroupId = hearingId;
            return hearing;
        }
    }
}