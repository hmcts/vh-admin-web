using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.Services.Models;
using AdminWebsite.UnitTests.Helper;
using AdminWebsite.UnitTests.Helpers;
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
using AdminWebsite.Contracts.Requests;
using NotificationApi.Contract;
using VideoApi.Client;
using EndpointResponse = AdminWebsite.BookingsAPI.Client.EndpointResponse;
using LinkedParticipantRequest = AdminWebsite.BookingsAPI.Client.LinkedParticipantRequest;
using LinkedParticipantResponse = AdminWebsite.BookingsAPI.Client.LinkedParticipantResponse;
using LinkedParticipantType = AdminWebsite.BookingsAPI.Client.LinkedParticipantType;
using CaseResponse = AdminWebsite.BookingsAPI.Client.CaseResponse;

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
                Case_role_name = "Applicant",
                Hearing_role_name = "Representative"
            };

            // setup response
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                                    .WithParticipant("Representative", "username");
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
                Username = "username@hmcts.net",
                Case_role_name = "Applicant",
                Hearing_role_name = "Representative",
                Contact_email = "username@hmcts.net"
            };
            var participantList = new List<BookingsAPI.Client.ParticipantRequest> { participant };

            const string da = "username@hmcts.net";
            var endpoints = new EndpointRequest { Display_name = "displayname", Defence_advocate_username = da };
            var endpointList = new List<EndpointRequest> {endpoints};

            var hearing = new BookNewHearingRequest
            {
                Participants = participantList,
                Endpoints = endpointList
            };

            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = hearing
            };

            // setup response
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                                        .WithParticipant("Representative", participant.Username);
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);

            await _controller.Post(bookingRequest);
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
                        Case_role_name = "CaseRole", Contact_email = "contact1@hmcts.net",
                        Hearing_role_name = "HearingRole", Display_name = "display name1",
                        First_name = "fname", Middle_names = "", Last_name = "lname1", Username = "username1@hmcts.net",
                        Organisation_name = "", Representee = "", Telephone_number = ""
                    },
                    new BookingsAPI.Client.ParticipantRequest
                    {
                        Case_role_name = "CaseRole", Contact_email = "contact2@hmcts.net",
                        Hearing_role_name = "HearingRole", Display_name = "display name2",
                        First_name = "fname2", Middle_names = "", Last_name = "lname2",
                        Username = "username2@hmcts.net", Organisation_name = "", Representee = "",
                        Telephone_number = ""
                    },
                },
                Endpoints = new List<EndpointRequest>
                {
                    new EndpointRequest
                        {Display_name = "displayname1", Defence_advocate_username = "username1@hmcts.net"},
                    new EndpointRequest
                        {Display_name = "displayname2", Defence_advocate_username = "username2@hmcts.net"},
                }
            };
            
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = newHearingRequest
            };
            
            // setup response
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                                        .WithEndPoints(2)
                                        .WithParticipant("Representative", "username1@hmcts.net")
                                        .WithParticipant("Individual", "username2@hmcts.net");
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(newHearingRequest))
                .ReturnsAsync(hearingDetailsResponse);

            var result = await _controller.Post(bookingRequest);

            result.Result.Should().BeOfType<CreatedResult>();
            var createdObjectResult = (CreatedResult)result.Result;
            createdObjectResult.StatusCode.Should().Be(201);
        }

        [Test]
        public async Task Should_create_a_hearing_with_linked_participants()
        {
            // request.
            var newHearingRequest = new BookNewHearingRequest()
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>
                {
                    new BookingsAPI.Client.ParticipantRequest { Case_role_name = "CaseRole", Contact_email = "firstName1.lastName1@email.com",
                        Display_name = "firstName1 lastName1", First_name = "firstName1", Hearing_role_name = "Litigant in person", Last_name = "lastName1", Middle_names = "",
                        Organisation_name = "", Representee = "", Telephone_number = "1234567890", Title = "Mr.", Username = "firstName1.lastName1@email.net" },
                    new BookingsAPI.Client.ParticipantRequest { Case_role_name = "CaseRole", Contact_email = "firstName2.lastName2@email.com",
                        Display_name = "firstName2 lastName2", First_name = "firstName2", Hearing_role_name = "Interpreter", Last_name = "lastName2", Middle_names = "",
                        Organisation_name = "", Representee = "", Telephone_number = "1234567890", Title = "Mr.", Username = "firstName2.lastName2@email.net" },

                },
                Linked_participants = new List<LinkedParticipantRequest>
                    {
                        new LinkedParticipantRequest { Participant_contact_email = "firstName1.lastName1@email.com",
                            Linked_participant_contact_email = "firstName2.lastName2@email.com", Type = LinkedParticipantType.Interpreter },
                        new LinkedParticipantRequest { Participant_contact_email = "firstName2.lastName2@email.com",
                            Linked_participant_contact_email = "firstName1.lastName1@email.com", Type = LinkedParticipantType.Interpreter }
                    }
            };
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = newHearingRequest
            };
            // set response.
            var linkedParticipant1 = new List<LinkedParticipantResponse>() { new LinkedParticipantResponse() { Linked_id = Guid.NewGuid(), Type = LinkedParticipantType.Interpreter } };
            var participant1 = Builder<ParticipantResponse>.CreateNew().With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Individual").With(x => x.Username = "firstName1.lastName1@email.net")
                .With(x => x.Linked_participants = linkedParticipant1)
                .Build();
            var linkedParticipant2 = new List<LinkedParticipantResponse>() { new LinkedParticipantResponse() { Linked_id = Guid.NewGuid(), Type = LinkedParticipantType.Interpreter } };
            var participant2 = Builder<ParticipantResponse>.CreateNew().With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Individual").With(x => x.Username = "firstName1.lastName1@email.net")
                .With(x => x.Linked_participants = linkedParticipant2)
                .Build();
            var hearingDetailsResponse = Builder<HearingDetailsResponse>.CreateNew()
                .With(x => x.Cases = Builder<CaseResponse>.CreateListOfSize(2).Build().ToList())
                .With(x => x.Endpoints = Builder<EndpointResponse>.CreateListOfSize(2).Build().ToList())
                .With(x => x.Participants = new List<ParticipantResponse> { participant1, participant2 }).Build();
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(newHearingRequest))
                .ReturnsAsync(hearingDetailsResponse);
            var result = await _controller.Post(bookingRequest);
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
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                                            .WithParticipant("Judge");
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
            
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = hearing
            };

            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var result = await _controller.Post(bookingRequest);
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }
        
        [Test]
        public void Should_throw_BookingsApiException()
        {
            var hearing = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>()
            };

            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = hearing
            };
            
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));

            Assert.ThrowsAsync<BookingsApiException>(() => _controller.Post(bookingRequest));
        }
        
        [Test]
        public void Should_throw_Exception()
        {
            var hearing = new BookNewHearingRequest
            {
                Participants = new List<BookingsAPI.Client.ParticipantRequest>()
            };
            
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = hearing
            };

            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .Throws(new Exception("Some internal error"));

            Assert.ThrowsAsync<Exception>(() => _controller.Post(bookingRequest));
        }

        [Test]
        public async Task Should_pass_current_user_as_created_by_to_service()
        {
            const string CURRENT_USERNAME = "test@hmcts.net";
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns(CURRENT_USERNAME);

            // setup response
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                                        .WithParticipant("Representative")
                                        .WithParticipant("Individual");
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
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("admin@hmcts.net");
            _bookingsApiClient
                .Setup(x => x.UpdateBookingStatusAsync(It.IsAny<Guid>(), It.IsAny<UpdateBookingStatusRequest>()))
                .Verifiable();

            var vhExistingHearing = new HearingDetailsResponse
            {
                Case_type_name = "Generic"
            };

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(vhExistingHearing);

            var response = await _controller.UpdateBookingStatus(Guid.NewGuid(), new UpdateBookingStatusRequest());

            response.Should().BeOfType<OkObjectResult>();

            _bookingsApiClient.Verify(
                x => x.UpdateBookingStatusAsync(It.IsAny<Guid>(), It.IsAny<UpdateBookingStatusRequest>()),
                Times.Exactly(2));
        }

        [Test]
        public async Task Should_catch_BookingsApiException_by_updating_booking_status_and_returns_bad_result()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("admin@hmcts.net");
            _bookingsApiClient.Setup(x =>
                    x.UpdateBookingStatusAsync(It.IsAny<Guid>(), It.IsAny<UpdateBookingStatusRequest>()))
                .Throws(new BookingsApiException("Error", 400, "response", null, null));

            var response = await _controller.UpdateBookingStatus(Guid.NewGuid(), new UpdateBookingStatusRequest());

            response.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public async Task Should_catch_BookingsApiException_by_updating_booking_status_and_returns_not_found_result()
        {
            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns("admin@hmcts.net");
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
            var request = new MultiHearingRequest { StartDate = startDate, EndDate = endDate};


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
                Case_role_name = "Applicant",
                Hearing_role_name = "Representative"
            };

            var newUserName = "some_new_user@hmcts.net";
            // setup response
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                                        .WithParticipant("Representative", newUserName);
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);
            _userAccountService
                .Setup(x => x.UpdateParticipantUsername(It.IsAny<AdminWebsite.BookingsAPI.Client.ParticipantRequest>()))
                .Callback<AdminWebsite.BookingsAPI.Client.ParticipantRequest>(p => { p.Username = newUserName; })
                .ReturnsAsync(new User() { UserName = newUserName, Password = "test123" });

            await PostWithParticipants(participant);

            _notificationApiMock.Verify(x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(request =>
                request.NotificationType == NotificationType.CreateRepresentative)), Times.Once);
        }

        [Test]
        public async Task Should_send_email_for_new_individual_participant_added()
        {
            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = string.Empty, // New participant
                Case_role_name = "Applicant",
                Hearing_role_name = "Individual"
            };

            var newUserName = "some_new_user@hmcts.net";
            // setup response
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                                        .WithParticipant("Individual", newUserName);
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);
            _userAccountService
                .Setup(x => x.UpdateParticipantUsername(It.IsAny<AdminWebsite.BookingsAPI.Client.ParticipantRequest>()))
                .Callback<AdminWebsite.BookingsAPI.Client.ParticipantRequest>(p => { p.Username = newUserName; })
                .ReturnsAsync(new User { UserName = newUserName, Password = "test123" });

            await PostWithParticipants(participant);

            _notificationApiMock.Verify(x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(request =>
                request.NotificationType == NotificationType.CreateIndividual)), Times.Once);
        }

        [Test]
        public async Task Should_not_send_email_for_existing_participant_added()
        {
            var existingUserName = "some_new_user@hmcts.net";
            var participant = new BookingsAPI.Client.ParticipantRequest
            {
                Username = existingUserName,
                Case_role_name = "Applicant",
                Hearing_role_name = "Representative"
            };

            // setup response
            var hearingDetailsResponse = HearingResponseBuilder.Build()
                                         .WithParticipant("Representative", existingUserName);
            _bookingsApiClient.Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ReturnsAsync(hearingDetailsResponse);
                
            await PostWithParticipants(participant);

            _notificationApiMock.Verify(
                x => x.CreateNewNotificationAsync(It.Is<AddNotificationRequest>(request =>
                    request.NotificationType == NotificationType.CreateRepresentative)), Times.Never);
        }

        private static MultiHearingRequest GetMultiHearingRequest()
        {
            var startDate = new DateTime(2020, 10, 1);
            var endDate = new DateTime(2020, 10, 6);
            return new MultiHearingRequest { StartDate = startDate, EndDate = endDate };
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
            
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = hearing
            };

            return await _controller.Post(bookingRequest);
        }
    }
}