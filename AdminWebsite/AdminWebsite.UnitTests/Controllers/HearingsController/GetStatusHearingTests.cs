using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.Enums;
using BookingsApi.Contract.Responses;
using Autofac.Extras.Moq;
using BookingsApi.Contract.Configuration;
using BookingsApi.Contract.Requests;
using VideoApi.Client;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class GetStatusHearingTests
    {
        private AutoMock _mocker;
        private AdminWebsite.Controllers.HearingsController _controller;

        private HearingDetailsResponse _vhExistingHearing;
        private Guid _guid;

        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IUserAccountService> _userAccountService;
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;
        private IHearingsService _hearingsService;
        private Mock<IConferenceDetailsService> _conferencesServiceMock;
        private Mock<ILogger<HearingsService>> _participantGroupLogger;

        private Mock<ILogger<AdminWebsite.Controllers.HearingsController>> _logger;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userAccountService = new Mock<IUserAccountService>();
            _editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();
            _conferencesServiceMock = new Mock<IConferenceDetailsService>();
            _logger = new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>();
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

            _participantGroupLogger = new Mock<ILogger<HearingsService>>();
            _hearingsService = new HearingsService(_bookingsApiClient.Object, _participantGroupLogger.Object);
            _bookingsApiClient.Setup(x => x.GetFeatureFlagAsync(It.Is<string>(f => f == nameof(FeatureFlags.EJudFeature)))).ReturnsAsync(true);

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _editHearingRequestValidator.Object,
                _logger.Object,
                _hearingsService,
                _conferencesServiceMock.Object);

            Initialise();
        }

        public void Initialise()
        {
            _guid = Guid.NewGuid();
            _vhExistingHearing = new HearingDetailsResponse
            {
                Cases = new List<BookingsApi.Contract.Responses.CaseResponse>()
                {
                    new BookingsApi.Contract.Responses.CaseResponse
                        {Name = "BBC vs ITV", Number = "TX/12345/2019", IsLeadCase = false}
                },
                CaseTypeName = "Generic",
                CreatedBy = "CaseAdministrator",
                CreatedDate = DateTime.UtcNow,
                HearingRoomName = "Room 6.41D",
                HearingTypeName = "Automated Test",
                HearingVenueName = "Manchester Civil and Family Justice Centre",
                Id = _guid,
                OtherInformation = "Any other information about the hearing",
                Participants = new List<ParticipantResponse>()
                {
                    new ParticipantResponse()
                    {
                        CaseRoleName = "Judge", ContactEmail = "Judge.Lumb@hmcts.net", DisplayName = "Judge Lumb",
                        FirstName = "Judge", HearingRoleName = "Judge", LastName = "Lumb", MiddleNames = string.Empty,
                        TelephoneNumber = string.Empty, Title = "Judge", Username = "Judge.Lumb@hmcts.net"
                    },
                    new ParticipantResponse()
                    {
                        CaseRoleName = "Applicant", ContactEmail = "test.applicant@hmcts.net",
                        DisplayName = "Test Applicant", FirstName = "Test", HearingRoleName = "Litigant in person",
                        LastName = "Applicant", MiddleNames = string.Empty, TelephoneNumber = string.Empty,
                        Title = "Mr", Username = "Test.Applicant@hmcts.net"
                    },
                    new ParticipantResponse()
                    {
                        CaseRoleName = "Respondent", ContactEmail = "test.respondent@hmcts.net",
                        DisplayName = "Test Respondent", FirstName = "Test", HearingRoleName = "Representative",
                        LastName = "Respondent", MiddleNames = string.Empty, TelephoneNumber = string.Empty,
                        Title = "Mr", Username = "Test.Respondent@hmcts.net"
                    },
                },
                ScheduledDateTime = DateTime.UtcNow.AddDays(10),
                ScheduledDuration = 60,
                Status = BookingStatus.Booked,
                UpdatedBy = string.Empty,
                UpdatedDate = DateTime.UtcNow
            };

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_vhExistingHearing);
        }

        [Test]
        public async Task Should_return_ok_status_if_hearing_has_valid_room()
        {

            ConferenceDetailsResponse mock = new ConferenceDetailsResponse();
            mock.MeetingRoom = new MeetingRoomResponse();
            mock.MeetingRoom.AdminUri = "AdminUri";
            mock.MeetingRoom.ParticipantUri = "ParticipantUri";
            mock.MeetingRoom.JudgeUri = "JudgeUri";
            mock.MeetingRoom.PexipNode = "PexipNode";


            // Arrange
            _conferencesServiceMock.Setup(x => x.GetConferenceDetailsByHearingId(_guid))
                .ReturnsAsync(mock);

            // Act
            var result = await _controller.GetHearingConferenceStatus(_guid);

            // Assert
            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);

            var hearing = (UpdateBookingStatusResponse) ((OkObjectResult) result).Value;
            hearing.Success.Should().Be(true);
        }

        [Test]
        public async Task Should_return_ok_status_if_hearing_has_not_valid_room()
        {

            ConferenceDetailsResponse mock = new ConferenceDetailsResponse();
            mock.MeetingRoom = new MeetingRoomResponse();


            // Arrange
            _mocker.Mock<IConferenceDetailsService>().Setup(x => x.GetConferenceDetailsByHearingId(It.IsAny<Guid>()))
                .ReturnsAsync(mock);

            // Act
            var result = await _controller.GetHearingConferenceStatus(_guid);

            // Assert
            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);

            var hearing = (UpdateBookingStatusResponse) ((OkObjectResult) result).Value;
            hearing.Success.Should().Be(false);
        }

        [Test]
        public async Task Should_return_not_found_if_hearing_has_not_be_found()
        {

            ConferenceDetailsResponse mock = new ConferenceDetailsResponse();
            mock.MeetingRoom = new MeetingRoomResponse();


            // Arrange
            _mocker.Mock<IConferenceDetailsService>().Setup(x => x.GetConferenceDetailsByHearingId(It.IsAny<Guid>()))
                .Throws(new VideoApiException("Error", 404, null, null, null));

            // Act
            var result = await _controller.GetHearingConferenceStatus(_guid);

            // Assert
            var notFoundResult = (OkObjectResult)result;
            notFoundResult.StatusCode.Should().Be(200);
            ((UpdateBookingStatusResponse) notFoundResult.Value).Success.Should().BeFalse();

        }

        [Test]
        public async Task Should_return_not_found_if_hearing_failed_to_update()
        {
            // Arrange
            _bookingsApiClient
                .Setup(x => x.UpdateBookingStatusAsync(_guid, It.IsAny<UpdateBookingStatusRequest>()))
                .ThrowsAsync(new VideoApiException("Error", 404, null, null, null));

            // Act
            var result = await _controller.UpdateHearingStatus(_guid);

            // Assert
            var notFoundResult = (NotFoundResult)result;
            notFoundResult.StatusCode.Should().Be(404);

        }

        [Test]
        public async Task Should_return_ok_status_after_update_hearing()
        {


            // Arrange
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(It.IsAny<Guid>(), It.IsAny<UpdateBookingStatusRequest>()));

            // Act
            var result = await _controller.UpdateHearingStatus(_guid);

            // Assert
            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);

            var hearing = (UpdateBookingStatusResponse) ((OkObjectResult) result).Value;
            hearing.Success.Should().Be(false);
        }
    }
}