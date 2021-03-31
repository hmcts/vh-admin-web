using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helpers;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NotificationApi.Client;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Requests;
using NotificationApi.Contract;
using NotificationApi.Contract.Requests;
using UserApi.Client;
using UserApi.Contract.Requests;
using UserApi.Contract.Responses;
using VideoApi.Client;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class BookNewHearingTests
    {
        private Mock<IUserApiClient> _userApiClient;
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private IUserAccountService _userAccountService;
        private Mock<ILogger<UserAccountService>> _userAccountServiceLogger;
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;
        private Mock<IVideoApiClient> _videoApiMock;
        private Mock<IPollyRetryService> _pollyRetryServiceMock;
        private Mock<INotificationApiClient> _notificationApiMock;
        private Mock<ILogger<HearingsService>> _participantGroupLogger;
        private IHearingsService _hearingsService;

        private AdminWebsite.Controllers.HearingsController _controller;
        private BookNewHearingRequest _bookNewHearingRequest;

        [SetUp]
        public void Setup()
        {
            _userApiClient = new Mock<IUserApiClient>();
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userAccountServiceLogger = new Mock<ILogger<UserAccountService>>();
            _notificationApiMock = new Mock<INotificationApiClient>();

            _userAccountService = new UserAccountService(_userApiClient.Object, _bookingsApiClient.Object,
                _notificationApiMock.Object, _userAccountServiceLogger.Object);

            _editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();
            _videoApiMock = new Mock<IVideoApiClient>();
            _pollyRetryServiceMock = new Mock<IPollyRetryService>();

            _participantGroupLogger = new Mock<ILogger<HearingsService>>();
            _hearingsService = new HearingsService(_pollyRetryServiceMock.Object,
                _userAccountService, _notificationApiMock.Object, _videoApiMock.Object, _bookingsApiClient.Object,
                _participantGroupLogger.Object);

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _userAccountService,
                _editHearingRequestValidator.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object,
                _hearingsService,
                Mock.Of<IPublicHolidayRetriever>());
            
            InitHearingForTest();
        }

        [Test]
        public async Task Should_book_hearing()
        {   
            // setup response
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                                         .WithEndPoints(2)
                                         .WithParticipant("Representative", "username1@hmcts.net")
                                         .WithParticipant("Individual", "fname2.lname2@hmcts.net")
                                         .WithParticipant("Individual", "fname3.lname3@hmcts.net")
                                         .WithParticipant("Judicial Office Holder", "fname4.lname4@hmcts.net")
                                         .WithParticipant("Judge", "judge.fudge@hmcts.net");
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(_bookNewHearingRequest))
                .ReturnsAsync(hearingDetailsResponse);

            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = _bookNewHearingRequest
            };
            var result = await _controller.Post(bookingRequest);

            result.Result.Should().BeOfType<CreatedResult>();
            var createdObjectResult = (CreatedResult) result.Result;
            createdObjectResult.StatusCode.Should().Be(201);

            _bookNewHearingRequest.Participants.Any(x => string.IsNullOrWhiteSpace(x.Username)).Should().BeFalse();
            _pollyRetryServiceMock.Verify(x => x.WaitAndRetryAsync<Exception, Task>
            (
                It.IsAny<int>(), It.IsAny<Func<int, TimeSpan>>(), It.IsAny<Action<int>>(),
                It.IsAny<Func<Task, bool>>(), It.IsAny<Func<Task<Task>>>()
            ), Times.Exactly(4));

            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(notification =>
                    notification.NotificationType == NotificationType.HearingConfirmationJudge)), Times.Never);
            
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(notification =>
                    notification.NotificationType == NotificationType.HearingConfirmationLip)), Times.AtLeast(1));
            
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(notification =>
                    notification.NotificationType == NotificationType.HearingConfirmationRepresentative)), Times.AtLeast(1));
            
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(notification =>
                    notification.NotificationType == NotificationType.HearingConfirmationJoh)), Times.AtLeast(1));
        }

        [Test]
        public async Task should_not_send_notice_email_for_generic_hearing()
        {
            // setup response
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                .WithEndPoints(2)
                .WithParticipant("Representative", "username1@hmcts.net")
                .WithParticipant("Individual", "fname2.lname2@hmcts.net")
                .WithParticipant("Individual", "fname3.lname3@hmcts.net")
                .WithParticipant("Judicial Office Holder", "fname4.lname4@hmcts.net")
                .WithParticipant("Judge", "judge.fudge@hmcts.net");
            hearingDetailsResponse.Case_type_name = "Generic";
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(_bookNewHearingRequest))
                .ReturnsAsync(hearingDetailsResponse);

            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = _bookNewHearingRequest
            };
            var result = await _controller.Post(bookingRequest);

            result.Result.Should().BeOfType<CreatedResult>();
            var createdObjectResult = (CreatedResult) result.Result;
            createdObjectResult.StatusCode.Should().Be(201);
            
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(notification =>
                    notification.NotificationType == NotificationType.HearingConfirmationJudge)), Times.Never);
            
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(notification =>
                    notification.NotificationType == NotificationType.HearingConfirmationLip)), Times.Never);
            
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(notification =>
                    notification.NotificationType == NotificationType.HearingConfirmationRepresentative)), Times.Never);
            
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(notification =>
                    notification.NotificationType == NotificationType.HearingConfirmationJoh)), Times.Never);
        }

        [Test]
        public async Task should_send_multi_day_notice_confirmation_when_hearing_is_a_multi_day_hearing()
        {
            // setup response
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                .WithEndPoints(2)
                .WithParticipant("Representative", "username1@hmcts.net")
                .WithParticipant("Individual", "fname2.lname2@hmcts.net")
                .WithParticipant("Individual", "fname3.lname3@hmcts.net")
                .WithParticipant("Judicial Office Holder", "fname4.lname4@hmcts.net")
                .WithParticipant("Judge", "judge.fudge@hmcts.net");
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(_bookNewHearingRequest))
                .ReturnsAsync(hearingDetailsResponse);

            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = _bookNewHearingRequest,
                IsMultiDay = true,
                MultiHearingDetails = new MultiHearingRequest
                {
                    StartDate = hearingDetailsResponse.Scheduled_date_time,
                    EndDate = hearingDetailsResponse.Scheduled_date_time.AddDays(7)
                }
            };
            var result = await _controller.Post(bookingRequest);

            result.Result.Should().BeOfType<CreatedResult>();
            var createdObjectResult = (CreatedResult) result.Result;
            createdObjectResult.StatusCode.Should().Be(201);
            
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(notification =>
                    notification.NotificationType == NotificationType.HearingConfirmationJudgeMultiDay)), Times.Never);
            
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(notification =>
                    notification.NotificationType == NotificationType.HearingConfirmationLipMultiDay)), Times.AtLeast(1));
            
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(notification =>
                    notification.NotificationType == NotificationType.HearingConfirmationRepresentativeMultiDay)), Times.AtLeast(1));
            
            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(notification =>
                    notification.NotificationType == NotificationType.HearingConfirmationJohMultiDay)), Times.AtLeast(1));
        }

        private void InitHearingForTest()
        {
            // request with existing person, new user, existing user in AD but not in persons table 
            _bookNewHearingRequest = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>
                {
                    new BookingsAPI.Client.ParticipantRequest
                    {
                        Case_role_name = "CaseRole", Contact_email = "contact1@hmcts.net",
                        Hearing_role_name = "HearingRole", Display_name = "display name1",
                        First_name = "fname", Middle_names = "", Last_name = "lname1", Username = "username1@hmcts.net",
                        Organisation_name = "", Representee = "", Telephone_number = ""
                    },
                    new BookingsAPI.Client.ParticipantRequest
                    {
                        Case_role_name = "CaseRole", Contact_email = "contact2@hmcts.net",
                        Hearing_role_name = "HearingRole", Display_name = "display name2",
                        First_name = "fname2", Middle_names = "", Last_name = "lname2", Organisation_name = "",
                        Representee = "", Telephone_number = ""
                    },
                    new BookingsAPI.Client.ParticipantRequest
                    {
                        Case_role_name = "CaseRole", Contact_email = "contact3@hmcts.net",
                        Hearing_role_name = "HearingRole", Display_name = "display name3",
                        First_name = "fname3", Middle_names = "", Last_name = "lname3", Organisation_name = "",
                        Representee = "", Telephone_number = ""
                    },
                    new BookingsAPI.Client.ParticipantRequest
                    {
                        Case_role_name = "Panel Member", Contact_email = "contact4@hmcts.net",
                        Hearing_role_name = "HearingRole", Display_name = "display name4",
                        First_name = "fname4", Middle_names = "", Last_name = "lname4", Organisation_name = "",
                        Representee = "", Telephone_number = ""
                    },
                    new BookingsAPI.Client.ParticipantRequest
                    {
                        Case_role_name = "Judge", Contact_email = "judge@hmcts.net",
                        Hearing_role_name = "Judge", Display_name = "Judge Fudge",
                        First_name = "Jack", Middle_names = "", Last_name = "Fudge",
                        Username = "judge.fudge@hmcts.net", Organisation_name = "", Representee = "",
                        Telephone_number = ""
                    }
                },
                Endpoints = new List<EndpointRequest>
                {
                    new EndpointRequest
                        {Display_name = "displayname1", Defence_advocate_username = "username1@hmcts.net"},
                    new EndpointRequest
                        {Display_name = "displayname2", Defence_advocate_username = "fname2.lname2@hmcts.net"},
                }
            };

            foreach (var participant in _bookNewHearingRequest.Participants.Where(x => !string.IsNullOrWhiteSpace(x.Username)))
            {
                var profile = new UserProfile
                {
                    UserId = Guid.NewGuid().ToString(),
                    UserName = participant.Username,
                    FirstName = participant.First_name,
                    LastName = participant.Last_name
                };
                _userApiClient.Setup(x => x.GetUserByAdUserIdAsync(It.Is<string>(e => e == participant.Username)))
                    .ReturnsAsync(profile);
            }

            foreach (var participant in _bookNewHearingRequest.Participants.Where(x => string.IsNullOrWhiteSpace(x.Username)))
            {
                var newUser = new NewUserResponse()
                {
                    UserId = Guid.NewGuid().ToString(),
                    Username = $"{participant.First_name}.{participant.Last_name}@hmcts.net",
                    OneTimePassword = "randomTest123"
                };
                _userApiClient
                    .Setup(x => x.CreateUserAsync(It.Is<CreateUserRequest>(userRequest =>
                        userRequest.RecoveryEmail == participant.Contact_email))).ReturnsAsync(newUser);
            }

            var existingPat3 = _bookNewHearingRequest.Participants.Single(x => x.Contact_email == "contact3@hmcts.net");

            var existingUser3 = new UserProfile()
            {
                UserId = Guid.NewGuid().ToString(),
                UserName = $"{existingPat3.First_name}.{existingPat3.Last_name}@hmcts.net",
                Email = existingPat3.Contact_email,
                FirstName = existingPat3.First_name,
                LastName = existingPat3.Last_name,
                DisplayName = existingPat3.Display_name,
            };
            _userApiClient
                .Setup(x => x.GetUserByEmailAsync(existingPat3.Contact_email)).ReturnsAsync(existingUser3);

            _pollyRetryServiceMock.Setup(x => x.WaitAndRetryAsync<Exception, Task>
                (
                    It.IsAny<int>(), It.IsAny<Func<int, TimeSpan>>(), It.IsAny<Action<int>>(),
                    It.IsAny<Func<Task, bool>>(), It.IsAny<Func<Task<Task>>>()
                ))
                .Callback(async (int retries, Func<int, TimeSpan> sleepDuration, Action<int> retryAction,
                    Func<Task, bool> handleResultCondition, Func<Task> executeFunction) =>
                {
                    sleepDuration(1);
                    retryAction(1);
                    handleResultCondition(Task.CompletedTask);
                    await executeFunction();
                })
                .ReturnsAsync(Task.CompletedTask);

        }
    }
}