using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.Services.Models;
using AdminWebsite.UnitTests.Helper;
using AdminWebsite.VideoAPI.Client;
using FizzWare.NBuilder;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NotificationApi.Client;
using NotificationApi.Contract.Requests;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using EndpointResponse = AdminWebsite.BookingsAPI.Client.EndpointResponse;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class PostHearingTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IUserAccountService> _userAccountService;
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;
        private Mock<IVideoApiClient> _videoApiMock;
        private Mock<IPollyRetryService> _pollyRetryServiceMock;
        private Mock<INotificationApiClient> _notificationApiMock;

        private Mock<ILogger<HearingsService>> _participantGroupLogger;
        private IHearingsService _hearingsService;

        private AdminWebsite.Controllers.HearingsController _controller;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userAccountService = new Mock<IUserAccountService>();
            _editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();
            _videoApiMock = new Mock<IVideoApiClient>();
            _notificationApiMock = new Mock<INotificationApiClient>();
            _pollyRetryServiceMock = new Mock<IPollyRetryService>();

            _participantGroupLogger = new Mock<ILogger<HearingsService>>();
            _hearingsService = new HearingsService(_pollyRetryServiceMock.Object,
                _userAccountService.Object, _notificationApiMock.Object, _videoApiMock.Object, _bookingsApiClient.Object, _participantGroupLogger.Object);

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _userAccountService.Object,
                _editHearingRequestValidator.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object,
                _hearingsService);

            _userAccountService
                .Setup(x => x.UpdateParticipantUsername(It.IsAny<AdminWebsite.BookingsAPI.Client.ParticipantRequest>()))
                .Callback<AdminWebsite.BookingsAPI.Client.ParticipantRequest>(p => { p.Username ??= p.Contact_email; })
                .ReturnsAsync(new User());
        }

        [Test]
        public async Task Should_update_participant_user_details()
        {
            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = "username",
                Case_role_name = "Claimant",
                Hearing_role_name = "Representative"
            };

            // setup response
            var pat1 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Representative")
                .With(x => x.Username = "username")
                .Build();
            var hearingDetailsResponse = Builder<HearingDetailsResponse>.CreateNew()
                .With(x => x.Participants = new List<ParticipantResponse> { pat1 }).Build();
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);

            await PostWithParticipants(participant);

            _userAccountService.Verify(x => x.GetAdUserIdForUsername(participant.Username), Times.Once);
        }

        [Test]
        public async Task Should_update_participant_username_to_aad_email_id()
        {
            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = "username@newemail.com",
                Case_role_name = "Claimant",
                Hearing_role_name = "Representative",
                Contact_email = "username@email.com"
            };
            var participantList = new List<BookingsAPI.Client.ParticipantRequest> { participant };

            var da = "username@newemail.com";
            var endpoints = new EndpointRequest { Display_name = "displayname", Defence_advocate_username = da };
            var endpointList = new List<EndpointRequest>();
            endpointList.Add(endpoints);

            var hearing = new BookNewHearingRequest
            {
                Participants = participantList,
                Endpoints = endpointList
            };

            // setup response
            var pat1 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Representative")
                .With(x => x.Username = participant.Username).Build();
            var hearingDetailsResponse = Builder<HearingDetailsResponse>.CreateNew()
                .With(x => x.Participants = new List<ParticipantResponse> { pat1 }).Build();
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);

            await _controller.Post(hearing);
            _userAccountService.Verify(x => x.GetAdUserIdForUsername(participant.Username), Times.Once);
        }

        [Test]
        public async Task Should_create_a_hearing_with_endpoints()
        {
            var newHearingRequest = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>
                {
                    new BookingsAPI.Client.ParticipantRequest
                    {
                        Case_role_name = "CaseRole", Contact_email = "contact1@email.com",
                        Hearing_role_name = "HearingRole", Display_name = "display name1",
                        First_name = "fname", Middle_names = "", Last_name = "lname1", Username = "username1@email.com",
                        Organisation_name = "", Representee = "", Telephone_number = ""
                    },
                    new BookingsAPI.Client.ParticipantRequest
                    {
                        Case_role_name = "CaseRole", Contact_email = "contact2@email.com",
                        Hearing_role_name = "HearingRole", Display_name = "display name2",
                        First_name = "fname2", Middle_names = "", Last_name = "lname2",
                        Username = "username2@email.com", Organisation_name = "", Representee = "",
                        Telephone_number = ""
                    },
                },
                Endpoints = new List<EndpointRequest>
                {
                    new EndpointRequest
                        {Display_name = "displayname1", Defence_advocate_username = "username1@email.com"},
                    new EndpointRequest
                        {Display_name = "displayname2", Defence_advocate_username = "username2@email.com"},
                }
            };
            // setup response
            var pat1 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Representative")
                .With(x => x.Username = "username1@email.com")
                .Build();
            var pat2 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Individual")
                .With(x => x.Username = "username2@email.com")
                .Build();
            var hearingDetailsResponse = Builder<HearingDetailsResponse>.CreateNew()
                .With(x => x.Endpoints = Builder<EndpointResponse>.CreateListOfSize(2).Build().ToList())
                .With(x => x.Participants = new List<ParticipantResponse> { pat1, pat2 }).Build();
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(newHearingRequest))
                .ReturnsAsync(hearingDetailsResponse);

            var result = await _controller.Post(newHearingRequest);

            result.Result.Should().BeOfType<CreatedResult>();
            var createdObjectResult = (CreatedResult)result.Result;
            createdObjectResult.StatusCode.Should().Be(201);
        }

        [Test]
        public async Task Should_not_update_user_details_for_judge()
        {
            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = "username",
                Case_role_name = "Judge",
                Hearing_role_name = "Judge"
            };

            // setup  response
            var judge = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Judge").Build();
            var hearingDetailsResponse = Builder<HearingDetailsResponse>.CreateNew()
                .With(x => x.Participants = new List<ParticipantResponse> { judge }).Build();
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);

            await PostWithParticipants(participant);

            _userAccountService.Verify(x => x.UpdateParticipantUsername(participant), Times.Never);
            _userAccountService.Verify(x => x.AssignParticipantToGroup(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task Should_pass_bad_request_from_bookings_api()
        {
            var hearing = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>()
            };

            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var result = await _controller.Post(hearing);
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }
        
        [Test]
        public void Should_throw_BookingsApiException()
        {
            var hearing = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>()
            };

            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));

            Assert.ThrowsAsync<BookingsApiException>(() => _controller.Post(hearing));
        }
        
        [Test]
        public void Should_throw_Exception()
        {
            var hearing = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>()
            };

            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .Throws(new Exception("Some internal error"));

            Assert.ThrowsAsync<Exception>(() => _controller.Post(hearing));
        }

        [Test]
        public async Task Should_pass_current_user_as_created_by_to_service()
        {
            const string CURRENT_USERNAME = "test@user.com";
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns(CURRENT_USERNAME);

            // setup response
            var pat1 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Representative").Build();
            var pat2 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Individual").Build();
            var hearingDetailsResponse = Builder<HearingDetailsResponse>.CreateNew()
                .With(x => x.Participants = new List<ParticipantResponse> { pat1, pat2 }).Build();
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);

            var result = await PostNewHearing();

            result.Result.Should().BeOfType<CreatedResult>();
            var createdResult = (CreatedResult)result.Result;
            createdResult.Location.Should().Be("");

            _bookingsApiClient.Verify(x => x.BookNewHearingAsync(It.Is<BookNewHearingRequest>(
                request => request.Created_by == CURRENT_USERNAME)), Times.Once);
            _userAccountService.Verify(x => x.AssignParticipantToGroup(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task Should_update_booking_status()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("admin@email.com");
            _bookingsApiClient
                .Setup(x => x.UpdateBookingStatusAsync(It.IsAny<Guid>(), It.IsAny<UpdateBookingStatusRequest>()))
                .Verifiable();

            var response = await _controller.UpdateBookingStatus(Guid.NewGuid(), new UpdateBookingStatusRequest());

            response.Should().BeOfType<OkObjectResult>();

            _bookingsApiClient.Verify(
                x => x.UpdateBookingStatusAsync(It.IsAny<Guid>(), It.IsAny<UpdateBookingStatusRequest>()),
                Times.Exactly(2));
        }

        [Test]
        public async Task Should_catch_BookingsApiException_by_updating_booking_status_and_returns_bad_result()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("admin@email.com");
            _bookingsApiClient.Setup(x =>
                    x.UpdateBookingStatusAsync(It.IsAny<Guid>(), It.IsAny<UpdateBookingStatusRequest>()))
                .Throws(new BookingsApiException("Error", 400, "response", null, null));

            var response = await _controller.UpdateBookingStatus(Guid.NewGuid(), new UpdateBookingStatusRequest());

            response.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public async Task Should_catch_BookingsApiException_by_updating_booking_status_and_returns_not_found_result()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("admin@email.com");
            _bookingsApiClient.Setup(x =>
                    x.UpdateBookingStatusAsync(It.IsAny<Guid>(), It.IsAny<UpdateBookingStatusRequest>()))
                .Throws(new BookingsApiException("Error", 404, "response", null, null));

            var response = await _controller.UpdateBookingStatus(Guid.NewGuid(), new UpdateBookingStatusRequest());

            response.Should().BeOfType<NotFoundObjectResult>();
        }

        [Test]
        public async Task Should_clone_hearing()
        {
            var request = GetMultiHearingRequest();
            _bookingsApiClient
                .Setup(x => x.CloneHearingAsync(It.IsAny<Guid>(), It.IsAny<CloneHearingRequest>()))
                .Verifiable();

            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<NoContentResult>();

            _bookingsApiClient.Verify(
                x => x.CloneHearingAsync(It.IsAny<Guid>(), It.IsAny<CloneHearingRequest>()),
                Times.Exactly(1));
        }

        [Test]
        public async Task Should_return_bad_request_status_if_no_items_in_the_date_list()
        {
            var startDate = new DateTime(2020, 10, 1);
            var endDate = new DateTime(2020, 10, 1);
            var request = new MultiHearingRequest { StartDate = startDate.ToString(), EndDate = endDate.ToString() };


            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<BadRequestResult>();
        }

        [Test]
        public async Task Should_catch_BookingsApiException_by_clone_hearing()
        {
            var request = GetMultiHearingRequest();
            _bookingsApiClient
                .Setup(x => x.CloneHearingAsync(It.IsAny<Guid>(), It.IsAny<CloneHearingRequest>()))
                .Throws(new BookingsApiException("Error", (int)HttpStatusCode.BadRequest, "response", null, null));

            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public async Task Should_send_email_for_new_representative_participant_added()
        {
            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = string.Empty, // New participant
                Case_role_name = "Claimant",
                Hearing_role_name = "Representative"
            };

            var newUserName = "some_new_user@name.net";
            // setup response
            var pat1 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Representative")
                .With(x => x.Username = newUserName)
                .Build();
            var hearingDetailsResponse = Builder<HearingDetailsResponse>.CreateNew()
                .With(x => x.Participants = new List<ParticipantResponse> { pat1 }).Build();
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);
            _userAccountService
                .Setup(x => x.UpdateParticipantUsername(It.IsAny<AdminWebsite.BookingsAPI.Client.ParticipantRequest>()))
                .Callback<AdminWebsite.BookingsAPI.Client.ParticipantRequest>(p => { p.Username = newUserName; })
                .ReturnsAsync(new User() { UserName = newUserName, Password = "test123" });

            await PostWithParticipants(participant);

            _notificationApiMock.Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_send_email_for_new_individual_participant_added()
        {
            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = string.Empty, // New participant
                Case_role_name = "Claimant",
                Hearing_role_name = "Individual"
            };

            var newUserName = "some_new_user@name.net";
            // setup response
            var pat1 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Individual")
                .With(x => x.Username = newUserName)
                .Build();
            var hearingDetailsResponse = Builder<HearingDetailsResponse>.CreateNew()
                .With(x => x.Participants = new List<ParticipantResponse> { pat1 }).Build();
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);
            _userAccountService
                .Setup(x => x.UpdateParticipantUsername(It.IsAny<AdminWebsite.BookingsAPI.Client.ParticipantRequest>()))
                .Callback<AdminWebsite.BookingsAPI.Client.ParticipantRequest>(p => { p.Username = newUserName; })
                .ReturnsAsync(new User() { UserName = newUserName, Password = "test123" });

            await PostWithParticipants(participant);

            _notificationApiMock.Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_not_send_email_for_existing_participant_added()
        {
            var existingUserName = "some_new_user@name.net";
            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = existingUserName,
                Case_role_name = "Claimant",
                Hearing_role_name = "Representative"
            };

            // setup response
            var pat1 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Representative")
                .With(x => x.Username = existingUserName)
                .Build();
            var hearingDetailsResponse = Builder<HearingDetailsResponse>.CreateNew()
                .With(x => x.Participants = new List<ParticipantResponse> { pat1 }).Build();
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);
                
            await PostWithParticipants(participant);

            _notificationApiMock.Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Never);
        }

        private MultiHearingRequest GetMultiHearingRequest()
        {
            var startDate = new DateTime(2020, 10, 1);
            var endDate = new DateTime(2020, 10, 6);
            return new MultiHearingRequest { StartDate = startDate.ToString(), EndDate = endDate.ToString() };
        }

        private Task<ActionResult<HearingDetailsResponse>> PostNewHearing()
        {
            // without supplying participants
            return PostWithParticipants();
        }

        private async Task<ActionResult<HearingDetailsResponse>> PostWithParticipants(
            params BookingsAPI.Client.ParticipantRequest[] participants)
        {
            var hearing = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>(participants)
            };

            return await _controller.Post(hearing);
        }
    }
}