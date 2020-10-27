using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using AdminWebsite.VideoAPI.Client;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Net;

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

        private AdminWebsite.Controllers.HearingsController _controller;
        private HearingDetailsResponse _vhExistingHearing;
        private readonly Guid _guid = Guid.NewGuid();

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userAccountService = new Mock<IUserAccountService>();
            _editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();
            _videoApiMock = new Mock<IVideoApiClient>();
            _pollyRetryServiceMock = new Mock<IPollyRetryService>();

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _userAccountService.Object,
                _editHearingRequestValidator.Object,
                _videoApiMock.Object,
                _pollyRetryServiceMock.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object);

            _vhExistingHearing = new HearingDetailsResponse
            {
                Cases = new List<BookingsAPI.Client.CaseResponse>() { new BookingsAPI.Client.CaseResponse() { Name = "BBC vs ITV", Number = "TX/12345/2019", Is_lead_case = false } },
                Case_type_name = "Civil Money Claims",
                Created_by = "CaseAdministrator",
                Created_date = DateTime.UtcNow,
                Hearing_room_name = "Room 6.41D",
                Hearing_type_name = "Application to Set Judgment Aside",
                Hearing_venue_name = "Manchester Civil and Family Justice Centre",
                Id = _guid,
                Other_information = "Any other information about the hearing",
                Participants = new List<ParticipantResponse>()
                {
                    new ParticipantResponse() { Case_role_name = "Judge", Contact_email = "Judge.Lumb@madeupemail.com", Display_name = "Judge Lumb", First_name = "Judge", Hearing_role_name = "Judge", Last_name = "Lumb", Middle_names = string.Empty, Telephone_number = string.Empty, Title = "Judge", Username = "Judge.Lumb@madeupemail.com" },
                    new ParticipantResponse() { Case_role_name = "Claimant", Contact_email = "test.claimaint@emailaddress.net", Display_name = "Test Claimaint", First_name = "Test", Hearing_role_name = "Claimant LIP", Last_name = "Claimaint", Middle_names = string.Empty, Telephone_number = string.Empty, Title = "Mr", Username = "Test.Claimaint@madeupemail.com" },
                    new ParticipantResponse() { Case_role_name = "Defendant", Contact_email = "test.defendant@emailaddress.net", Display_name = "Test Defendant", First_name = "Test", Hearing_role_name = "Representative", Last_name = "Defendant", Middle_names = string.Empty, Telephone_number = string.Empty, Title = "Mr", Username = "Test.Defendant@madeupemail.com" },
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
