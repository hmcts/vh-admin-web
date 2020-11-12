using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UserAPI.Client;
using AdminWebsite.VideoAPI.Client;
using FizzWare.NBuilder;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EndpointResponse = AdminWebsite.BookingsAPI.Client.EndpointResponse;

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

        private AdminWebsite.Controllers.HearingsController _controller;

        [SetUp]
        public void Setup()
        {
            _userApiClient = new Mock<IUserApiClient>();
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userAccountServiceLogger = new Mock<ILogger<UserAccountService>>();

            _userAccountService = new UserAccountService(_userApiClient.Object, _bookingsApiClient.Object,
                _userAccountServiceLogger.Object);

            _editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();
            _videoApiMock = new Mock<IVideoApiClient>();
            _pollyRetryServiceMock = new Mock<IPollyRetryService>();

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _userAccountService,
                _editHearingRequestValidator.Object,
                _videoApiMock.Object,
                _pollyRetryServiceMock.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object);
        }

        [Test]
        public async Task should_book_hearing()
        {
            // request with existing person, new user, existing user in AD but not in persons table 
            var request = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>
                {
                    new BookingsAPI.Client.ParticipantRequest
                    {
                        Case_role_name = "CaseRole", Contact_email = "contact1@email.com",
                        Hearing_role_name = "HearingRole", Display_name = "display name1",
                        First_name = "fname", Middle_names = "", Last_name = "lname1", Username = "username1@hmcts.net",
                        Organisation_name = "", Representee = "", Telephone_number = ""
                    },
                    new BookingsAPI.Client.ParticipantRequest
                    {
                        Case_role_name = "CaseRole", Contact_email = "contact2@email.com",
                        Hearing_role_name = "HearingRole", Display_name = "display name2",
                        First_name = "fname2", Middle_names = "", Last_name = "lname2", Organisation_name = "",
                        Representee = "", Telephone_number = ""
                    },
                    new BookingsAPI.Client.ParticipantRequest
                    {
                        Case_role_name = "CaseRole", Contact_email = "contact3@email.com",
                        Hearing_role_name = "HearingRole", Display_name = "display name3",
                        First_name = "fname3", Middle_names = "", Last_name = "lname3", Organisation_name = "",
                        Representee = "", Telephone_number = ""
                    },
                    new BookingsAPI.Client.ParticipantRequest
                    {
                        Case_role_name = "Judge", Contact_email = "judge@email.com",
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

            foreach (var participant in request.Participants.Where(x => !string.IsNullOrWhiteSpace(x.Username)))
            {
                var profile = new UserProfile
                {
                    User_id = Guid.NewGuid().ToString(),
                    User_name = participant.Username,
                    First_name = participant.First_name,
                    Last_name = participant.Last_name
                };
                _userApiClient.Setup(x => x.GetUserByAdUserIdAsync(It.Is<string>(e => e == participant.Username)))
                    .ReturnsAsync(profile);
            }

            foreach (var participant in request.Participants.Where(x => string.IsNullOrWhiteSpace(x.Username)))
            {
                var newUser = new NewUserResponse()
                {
                    User_id = Guid.NewGuid().ToString(),
                    Username = $"{participant.First_name}.{participant.Last_name}@hmcts.net",
                    One_time_password = "randomTest123"
                };
                _userApiClient
                    .Setup(x => x.CreateUserAsync(It.Is<CreateUserRequest>(userRequest =>
                        userRequest.Recovery_email == participant.Contact_email))).ReturnsAsync(newUser);
            }

            var existingPat3 = request.Participants.Single(x => x.Contact_email == "contact3@email.com");

            var existingUser3 = new UserProfile()
            {
                User_id = Guid.NewGuid().ToString(),
                User_name = $"{existingPat3.First_name}.{existingPat3.Last_name}@hmcts.net",
                Email = existingPat3.Contact_email,
                First_name = existingPat3.First_name,
                Last_name = existingPat3.Last_name,
                Display_name = existingPat3.Display_name,
            };
            _userApiClient
                .Setup(x => x.GetUserByEmailAsync(existingPat3.Contact_email)).ReturnsAsync(existingUser3);

            // setup response
            var pat1 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Representative")
                .With(x => x.Username = "username1@hmcts.net")
                .Build();
            var pat2 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Individual")
                .With(x => x.Username = "fname2.lname2@hmcts.net")
                .Build();
            var pat3 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Individual")
                .With(x => x.Username = "fname3.lname3@hmcts.net")
                .Build();
            var judge = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Judge")
                .With(x => x.Username = "judge.fudge@hmcts.net")
                .Build();
            var hearingDetailsResponse = Builder<HearingDetailsResponse>.CreateNew()
                .With(x => x.Endpoints = Builder<EndpointResponse>.CreateListOfSize(2).Build().ToList())
                .With(x => x.Participants = new List<ParticipantResponse> {pat1, pat2, pat3, judge}).Build();
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(request))
                .ReturnsAsync(hearingDetailsResponse);

            var result = await _controller.Post(request);

            result.Result.Should().BeOfType<CreatedResult>();
            var createdObjectResult = (CreatedResult) result.Result;
            createdObjectResult.StatusCode.Should().Be(201);

            request.Participants.Any(x => string.IsNullOrWhiteSpace(x.Username)).Should().BeFalse();
        }
    }
}