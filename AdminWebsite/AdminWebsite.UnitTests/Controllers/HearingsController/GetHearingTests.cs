using AdminWebsite.BookingsAPI.Client;
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
using VideoApi.Client;

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

            _participantGroupLogger = new Mock<ILogger<HearingsService>>();
            _hearingsService = new HearingsService(_pollyRetryServiceMock.Object,
                _userAccountService.Object, _notificationApiMock.Object, _videoApiMock.Object, _bookingsApiClient.Object, _participantGroupLogger.Object);

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _userAccountService.Object,
                _editHearingRequestValidator.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object,
                _hearingsService,
                Mock.Of<IPublicHolidayRetriever>());

            _vhExistingHearing = new HearingDetailsResponse
            {
                Cases = new List<BookingsAPI.Client.CaseResponse>() { new BookingsAPI.Client.CaseResponse() { Name = "BBC vs ITV", Number = "TX/12345/2019", Is_lead_case = false } },
                Case_type_name = "Generic",
                Created_by = "CaseAdministrator",
                Created_date = DateTime.UtcNow,
                Hearing_room_name = "Room 6.41D",
                Hearing_type_name = "Automated Test",
                Hearing_venue_name = "Manchester Civil and Family Justice Centre",
                Id = _guid,
                Other_information = "Any other information about the hearing",
                Participants = new List<ParticipantResponse>()
                {
                    new ParticipantResponse() { Case_role_name = "Judge", Contact_email = "Judge.Lumb@hmcts.net", Display_name = "Judge Lumb", First_name = "Judge", Hearing_role_name = "Judge", Last_name = "Lumb", Middle_names = string.Empty, Telephone_number = string.Empty, Title = "Judge", Username = "Judge.Lumb@hmcts.net" },
                    new ParticipantResponse() { Case_role_name = "Applicant", Contact_email = "test.applicant@hmcts.net", Display_name = "Test Applicant", First_name = "Test", Hearing_role_name = "Litigant in person", Last_name = "Applicant", Middle_names = string.Empty, Telephone_number = string.Empty, Title = "Mr", Username = "Test.Applicant@hmcts.net" },
                    new ParticipantResponse() { Case_role_name = "Respondent", Contact_email = "test.respondent@hmcts.net", Display_name = "Test Respondent", First_name = "Test", Hearing_role_name = "Representative", Last_name = "Respondent", Middle_names = string.Empty, Telephone_number = string.Empty, Title = "Mr", Username = "Test.Respondent@hmcts.net" },
                },
                Scheduled_date_time = DateTime.UtcNow.AddDays(10),
                Scheduled_duration = 60,
                Status = BookingStatus.Booked,
                Updated_by = string.Empty,
                Updated_date = DateTime.UtcNow
            };

            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_vhExistingHearing);
        }

        [Test]
        public void Should_return_ok_status_if_hearing_id_is_valid()
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsById(It.IsAny<Guid>()))
                .Returns(_vhExistingHearing);

            var result = _controller.GetHearingById(_guid);
            var okRequestResult = (OkObjectResult)result;
            okRequestResult.StatusCode.Should().Be(200);

            var hearing = (HearingDetailsResponse)((OkObjectResult)result).Value;
            hearing.Id.Should().Be(_vhExistingHearing.Id);
        }

        [Test]
        public void Should_return_bad_request_if_hearing_id_is_empty()
        {
            GivenApiThrowsExceptionOnGetHearing(HttpStatusCode.BadRequest);

            var invalidId = Guid.Empty;
            var result = _controller.GetHearingById(invalidId);
            var badRequestResult = (BadRequestObjectResult)result;
            badRequestResult.StatusCode.Should().Be(400);
        }

        private void GivenApiThrowsExceptionOnGetHearing(HttpStatusCode code)
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsById(It.IsAny<Guid>()))
                .Throws(ClientException.ForBookingsAPI(code));
        }
    }
}
