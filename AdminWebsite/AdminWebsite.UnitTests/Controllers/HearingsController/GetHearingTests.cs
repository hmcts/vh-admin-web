using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NotificationApi.Client;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.Enums;
using BookingsApi.Contract.Responses;
using VideoApi.Client;
using Microsoft.Extensions.Options;
using AdminWebsite.Configuration;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class GetHearingTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IUserAccountService> _userAccountService;
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;
        private Mock<IVideoApiClient> _videoApiMock;
        private Mock<IPollyRetryService> _pollyRetryServiceMock;
        private Mock<INotificationApiClient> _notificationApiMock;

        private AdminWebsite.Controllers.HearingsController _controller;
        private HearingDetailsResponse _vhExistingHearing;
        private readonly Guid _guid = Guid.NewGuid();

        private Mock<ILogger<HearingsService>> _participantGroupLogger;
        private IHearingsService _hearingsService;

        private Mock<IOptions<KinlyConfiguration>> _kinlyOptionsMock;
        private Mock<KinlyConfiguration> _kinlyConfigurationMock;

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

            _kinlyOptionsMock = new Mock<IOptions<KinlyConfiguration>>();
            _kinlyConfigurationMock = new Mock<KinlyConfiguration>();
            _kinlyOptionsMock.Setup((op) => op.Value).Returns(_kinlyConfigurationMock.Object);

            _participantGroupLogger = new Mock<ILogger<HearingsService>>();
            _hearingsService = new HearingsService(_pollyRetryServiceMock.Object,
                _userAccountService.Object, _notificationApiMock.Object, _videoApiMock.Object,
                _bookingsApiClient.Object, _participantGroupLogger.Object,
                _kinlyOptionsMock.Object);

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _userAccountService.Object,
                _editHearingRequestValidator.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object,
                _hearingsService,
                Mock.Of<IPublicHolidayRetriever>());

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

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_vhExistingHearing);
        }

        [Test]
        public async Task Should_return_ok_status_if_hearing_id_is_valid()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_vhExistingHearing);

            var result = await _controller.GetHearingById(_guid);
            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);

            var hearing = (HearingDetailsResponse) ((OkObjectResult) result).Value;
            hearing.Id.Should().Be(_vhExistingHearing.Id);
        }

        [Test]
        public async Task Should_return_bad_request_if_hearing_id_is_empty()
        {
            GivenApiThrowsExceptionOnGetHearing(HttpStatusCode.BadRequest);

            var invalidId = Guid.Empty;
            var result = await _controller.GetHearingById(invalidId);
            var badRequestResult = (BadRequestObjectResult) result;
            badRequestResult.StatusCode.Should().Be(400);
        }

        private void GivenApiThrowsExceptionOnGetHearing(HttpStatusCode code)
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(code));
        }
    }
}
