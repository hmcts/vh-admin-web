using AdminWebsite.Models;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NotificationApi.Client;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Security;
using AdminWebsite.Services.Models;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using NotificationApi.Contract;
using NotificationApi.Contract.Requests;
using UserApi.Client;
using UserApi.Contract.Requests;
using UserApi.Contract.Responses;
using Autofac.Extras.Moq;
using BookingsApi.Contract.Responses;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class BookNewHearingTests
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
        public async Task Should_book_hearing_for_single_day()
        {
            // Arrange
            var bookingDetails = InitHearingForTest();
            
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = bookingDetails
            };
            
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                .WithEndPoints(2)
                .WithParticipant("Representative", "username1@hmcts.net")
                .WithParticipant("Individual", "fname2.lname2@hmcts.net")
                .WithParticipant("Individual", "fname3.lname3@hmcts.net")
                .WithParticipant("Judicial Office Holder", "fname4.lname4@hmcts.net")
                .WithParticipant("Judge", "judge.fudge@hmcts.net");
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.BookNewHearingAsync(bookingDetails))
                .ReturnsAsync(hearingDetailsResponse);

            
            const string expectedUserIdentityName = "created by";
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns(expectedUserIdentityName);
            
            // Act
            var result = await _controller.Post(bookingRequest);

            // Assert
            result.Result.Should().BeOfType<CreatedResult>();
            var createdObjectResult = (CreatedResult) result.Result;
            createdObjectResult.StatusCode.Should().Be(201);
            createdObjectResult.Value.Should().Be(hearingDetailsResponse);
            
            bookingDetails.Participants.Any(x => string.IsNullOrWhiteSpace(x.Username)).Should().BeFalse();

            bookingDetails.CreatedBy.Should().Be(expectedUserIdentityName);
            
            _mocker.Mock<IHearingsService>().Verify(x => x.AssignEndpointDefenceAdvocates(It.IsAny<List<EndpointRequest>>(), It.Is<IReadOnlyCollection<BookingsApi.Contract.Requests.ParticipantRequest>>(x => x.SequenceEqual(bookingDetails.Participants.AsReadOnly()))), Times.Once);

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.BookNewHearingAsync(It.Is<BookNewHearingRequest>(y => y == bookingDetails)), Times.Once);

            _mocker.Mock<IHearingsService>().Verify(x => x.SendNewUserEmailParticipants(It.Is<HearingDetailsResponse>(y => y == hearingDetailsResponse), It.IsAny<Dictionary<string,User>>()), Times.Once);
            
            _mocker.Mock<IHearingsService>().Verify(x => x.AssignParticipantToCorrectGroups(It.Is<HearingDetailsResponse>(y => y == hearingDetailsResponse), It.IsAny<Dictionary<string,User>>()), Times.Once);
            
            _mocker.Mock<IHearingsService>().Verify(x => x.SendHearingConfirmationEmail(It.IsAny<HearingDetailsResponse>(), null), Times.Once);
        }
        
        [Test]
        public async Task Should_book_hearing_for_single_day_without_endpoints()
        {
            // Arrange
            var bookingDetails = InitHearingForTest();
            bookingDetails.Endpoints = null;
            
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = bookingDetails
            };
            
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                .WithEndPoints(2)
                .WithParticipant("Representative", "username1@hmcts.net")
                .WithParticipant("Individual", "fname2.lname2@hmcts.net")
                .WithParticipant("Individual", "fname3.lname3@hmcts.net")
                .WithParticipant("Judicial Office Holder", "fname4.lname4@hmcts.net")
                .WithParticipant("Judge", "judge.fudge@hmcts.net");
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.BookNewHearingAsync(bookingDetails))
                .ReturnsAsync(hearingDetailsResponse);
            
            const string expectedUserIdentityName = "created by";
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns(expectedUserIdentityName);

            // Act
            var result = await _controller.Post(bookingRequest);

            // Assert
            result.Result.Should().BeOfType<CreatedResult>();
            var createdObjectResult = (CreatedResult) result.Result;
            createdObjectResult.StatusCode.Should().Be(201);
            createdObjectResult.Value.Should().Be(hearingDetailsResponse);
            
            bookingDetails.CreatedBy.Should().Be(expectedUserIdentityName);
            bookingDetails.Participants.Any(x => string.IsNullOrWhiteSpace(x.Username)).Should().BeFalse();
            
            _mocker.Mock<IHearingsService>().Verify(x => x.AssignEndpointDefenceAdvocates(It.IsAny<List<EndpointRequest>>(), It.Is<IReadOnlyCollection<BookingsApi.Contract.Requests.ParticipantRequest>>(x => x.SequenceEqual(bookingDetails.Participants.AsReadOnly()))), Times.Never);

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.BookNewHearingAsync(It.Is<BookNewHearingRequest>(y => y == bookingDetails)), Times.Once);

            _mocker.Mock<IHearingsService>().Verify(x => x.SendNewUserEmailParticipants(It.Is<HearingDetailsResponse>(y => y == hearingDetailsResponse), It.IsAny<Dictionary<string,User>>()), Times.Once);
            
            _mocker.Mock<IHearingsService>().Verify(x => x.AssignParticipantToCorrectGroups(It.Is<HearingDetailsResponse>(y => y == hearingDetailsResponse), It.IsAny<Dictionary<string,User>>()), Times.Once);
            
            _mocker.Mock<IHearingsService>().Verify(x => x.SendHearingConfirmationEmail(It.IsAny<HearingDetailsResponse>(), null), Times.Once);
        }

        [Test]
        public async Task Should_book_hearing_for_multi_day()
        {
            // Arrange
            const int expectedMultiDayHearingDuration = 3;
            DateTime expectedStartDate = new DateTime(2021, 5, 10, 0, 0, 1);
            DateTime expectedEndDate = expectedStartDate.AddDays(expectedMultiDayHearingDuration - 1);

            var bookingDetails = InitHearingForTest();
            
            var bookingRequest = new BookHearingRequest
            {
                IsMultiDay = true,
                MultiHearingDetails = new MultiHearingRequest
                {
                    StartDate = expectedStartDate,
                    EndDate = expectedEndDate
                },
                BookingDetails = bookingDetails
            };
            
            _mocker.Mock<IUserAccountService>().Setup(x =>
                    x.UpdateParticipantUsername(It.IsAny<BookingsApi.Contract.Requests.ParticipantRequest>())).ReturnsAsync((BookingsApi.Contract.Requests.ParticipantRequest participant) => new User() { UserId = participant.ContactEmail, Password = ""});
            
            const string expectedUserIdentityName = "created by";
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns(expectedUserIdentityName);

            // setup response
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                .WithEndPoints(2)
                .WithParticipant("Representative", "username1@hmcts.net")
                .WithParticipant("Individual", "fname2.lname2@hmcts.net")
                .WithParticipant("Individual", "fname3.lname3@hmcts.net")
                .WithParticipant("Judicial Office Holder", "fname4.lname4@hmcts.net")
                .WithParticipant("Judge", "judge.fudge@hmcts.net");
            
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.BookNewHearingAsync(bookingDetails))
                .ReturnsAsync(hearingDetailsResponse);
            
            // Act
            var result = await _controller.Post(bookingRequest);

            // Assert
            result.Result.Should().BeOfType<CreatedResult>();
            var createdObjectResult = (CreatedResult) result.Result;
            createdObjectResult.StatusCode.Should().Be(201);
            createdObjectResult.Value.Should().Be(hearingDetailsResponse);
            
            bookingDetails.CreatedBy.Should().Be(expectedUserIdentityName);
            bookingDetails.Participants.Any(x => string.IsNullOrWhiteSpace(x.Username)).Should().BeFalse();
            
            _mocker.Mock<IHearingsService>().Verify(x => x.AssignEndpointDefenceAdvocates(It.IsAny<List<EndpointRequest>>(), It.Is<IReadOnlyCollection<BookingsApi.Contract.Requests.ParticipantRequest>>(x => x.SequenceEqual(bookingDetails.Participants.AsReadOnly()))), Times.Once);

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.BookNewHearingAsync(It.Is<BookNewHearingRequest>(y => y == bookingDetails)), Times.Once);

            _mocker.Mock<IHearingsService>().Verify(x => x.SendNewUserEmailParticipants(It.Is<HearingDetailsResponse>(y => y == hearingDetailsResponse), It.IsAny<Dictionary<string,User>>()), Times.Once);
            
            _mocker.Mock<IHearingsService>().Verify(x => x.AssignParticipantToCorrectGroups(It.Is<HearingDetailsResponse>(y => y == hearingDetailsResponse), It.IsAny<Dictionary<string,User>>()), Times.Once);
            
            _mocker.Mock<IHearingsService>().Verify(x => x.SendMultiDayHearingConfirmationEmail(It.IsAny<HearingDetailsResponse>(), expectedMultiDayHearingDuration), Times.Once);
        }

                [Test]
        public async Task Should_catch_bookings_api_exceptions_and_return_bad_request_if_that_was_the_status_code()
        {
            // Arrange
            var bookingDetails = InitHearingForTest();
            
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = bookingDetails
            };

            const string expectedExceptionResponse = "exception";
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.BookNewHearingAsync(bookingDetails))
                .Throws(new BookingsApiException("", (int) HttpStatusCode.BadRequest, expectedExceptionResponse, null, null));
            

            // Act
            var result = await _controller.Post(bookingRequest);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
            var badRequestObjectResult = (BadRequestObjectResult) result.Result;
            badRequestObjectResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            badRequestObjectResult.Value.Should().Be(expectedExceptionResponse);
            
            _mocker.Mock<IHearingsService>().Verify(x => x.AssignEndpointDefenceAdvocates(It.IsAny<List<EndpointRequest>>(), It.Is<IReadOnlyCollection<BookingsApi.Contract.Requests.ParticipantRequest>>(x => x.SequenceEqual(bookingDetails.Participants.AsReadOnly()))), Times.Once);

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()), Times.Once);

            _mocker.Mock<IHearingsService>().Verify(x => x.SendNewUserEmailParticipants(It.IsAny<HearingDetailsResponse>(), It.IsAny<Dictionary<string,User>>()), Times.Never);
            
            _mocker.Mock<IHearingsService>().Verify(x => x.AssignParticipantToCorrectGroups(It.IsAny<HearingDetailsResponse>(), It.IsAny<Dictionary<string,User>>()), Times.Never);
            
            _mocker.Mock<IHearingsService>().Verify(x => x.SendMultiDayHearingConfirmationEmail(It.IsAny<HearingDetailsResponse>(), It.IsAny<int>()), Times.Never);
        }
        
        private BookNewHearingRequest InitHearingForTest()
        {
            // request with existing person, new user, existing user in AD but not in persons table 
            var bookNewHearingRequest = new BookNewHearingRequest
            {
                Participants = new List<BookingsApi.Contract.Requests.ParticipantRequest>
                {
                    new BookingsApi.Contract.Requests.ParticipantRequest
                    {
                        CaseRoleName = "CaseRole", ContactEmail = "contact1@hmcts.net",
                        HearingRoleName = "HearingRole", DisplayName = "display name1",
                        FirstName = "fname", MiddleNames = "", LastName = "lname1", Username = "username1@hmcts.net",
                        OrganisationName = "", Representee = "", TelephoneNumber = ""
                    },
                    new BookingsApi.Contract.Requests.ParticipantRequest
                    {
                        CaseRoleName = "CaseRole", ContactEmail = "contact2@hmcts.net",
                        HearingRoleName = "HearingRole", DisplayName = "display name2",
                        FirstName = "fname2", MiddleNames = "", LastName = "lname2", OrganisationName = "",
                        Representee = "", TelephoneNumber = "", Username = "username2@hmcts.net"
                    },
                    new BookingsApi.Contract.Requests.ParticipantRequest
                    {
                        CaseRoleName = "CaseRole", ContactEmail = "contact3@hmcts.net",
                        HearingRoleName = "HearingRole", DisplayName = "display name3",
                        FirstName = "fname3", MiddleNames = "", LastName = "lname3", OrganisationName = "",
                        Representee = "", TelephoneNumber = "", Username = "username3@hmcts.net"
                    },
                    new BookingsApi.Contract.Requests.ParticipantRequest
                    {
                        CaseRoleName = "Panel Member", ContactEmail = "contact4@hmcts.net",
                        HearingRoleName = "HearingRole", DisplayName = "display name4",
                        FirstName = "fname4", MiddleNames = "", LastName = "lname4", OrganisationName = "",
                        Representee = "", TelephoneNumber = "", Username = "username4@hmcts.net"
                    },
                    new BookingsApi.Contract.Requests.ParticipantRequest
                    {
                        CaseRoleName = "Judge", ContactEmail = "judge@hmcts.net",
                        HearingRoleName = "Judge", DisplayName = "Judge Fudge",
                        FirstName = "Jack", MiddleNames = "", LastName = "Fudge",
                        Username = "judge.fudge@hmcts.net", OrganisationName = "", Representee = "",
                        TelephoneNumber = ""
                    }
                },
                Endpoints = new List<EndpointRequest>
                {
                    new EndpointRequest
                        {DisplayName = "displayname1", DefenceAdvocateUsername = "username1@hmcts.net"},
                    new EndpointRequest
                        {DisplayName = "displayname2", DefenceAdvocateUsername = "fname2.lname2@hmcts.net"},
                }
            };

            foreach (var participant in bookNewHearingRequest.Participants.Where(x =>
                !string.IsNullOrWhiteSpace(x.Username)))
            {
                var profile = new UserProfile
                {
                    UserId = Guid.NewGuid().ToString(),
                    UserName = participant.Username,
                    FirstName = participant.FirstName,
                    LastName = participant.LastName
                };
                _mocker.Mock<IUserApiClient>().Setup(x => x.GetUserByAdUserIdAsync(It.Is<string>(e => e == participant.Username)))
                    .ReturnsAsync(profile);
            }

            foreach (var participant in bookNewHearingRequest.Participants.Where(x =>
                string.IsNullOrWhiteSpace(x.Username)))
            {
                var newUser = new NewUserResponse()
                {
                    UserId = Guid.NewGuid().ToString(),
                    Username = $"{participant.FirstName}.{participant.LastName}@hmcts.net",
                    OneTimePassword = "randomTest123"
                };
                _mocker.Mock<IUserApiClient>()
                    .Setup(x => x.CreateUserAsync(It.Is<CreateUserRequest>(userRequest =>
                        userRequest.RecoveryEmail == participant.ContactEmail))).ReturnsAsync(newUser);
            }

            var existingPat3 = bookNewHearingRequest.Participants.Single(x => x.ContactEmail == "contact3@hmcts.net");

            var existingUser3 = new UserProfile()
            {
                UserId = Guid.NewGuid().ToString(),
                UserName = $"{existingPat3.FirstName}.{existingPat3.LastName}@hmcts.net",
                Email = existingPat3.ContactEmail,
                FirstName = existingPat3.FirstName,
                LastName = existingPat3.LastName,
                DisplayName = existingPat3.DisplayName,
            };
            
            _mocker.Mock<IUserApiClient>()
                .Setup(x => x.GetUserByEmailAsync(existingPat3.ContactEmail)).ReturnsAsync(existingUser3);

            _mocker.Mock<IPollyRetryService>().Setup(x => x.WaitAndRetryAsync<Exception, Task>
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

            return bookNewHearingRequest;
        }
    }
}