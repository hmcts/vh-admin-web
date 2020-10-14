using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Security;
using AdminWebsite.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Encodings.Web;
using AdminWebsite.Models;
using AdminWebsite.UnitTests.Helper;
using AdminWebsite.VideoAPI.Client;
using FluentValidation;
using Microsoft.Extensions.Logging;

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
                JavaScriptEncoder.Default,
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

        [Test]
        public void Should_return_booking_list_if_cursor_is_null()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            _bookingsApiClient.Setup(x => x.GetHearingsByTypes(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>()))
                .Returns(new BookingsResponse());

            var result = _controller.GetBookingsList(null, 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public void Should_return_booking_list_if_cursor_is_not_null()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            _bookingsApiClient.Setup(x => x.GetHearingsByTypes(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>()))
                .Returns(new BookingsResponse());
            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2" });

            _bookingsApiClient.Setup(s => s.GetCaseTypes()).Returns(new List<CaseTypeResponse>());

            var result = _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public void Should_return_unauthorized_for_booking_list_if_user_is_not_admin()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(false);
            _bookingsApiClient.Setup(x => x.GetHearingsByTypes(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>()))
                .Returns(new BookingsResponse());

            var result = _controller.GetBookingsList("cursor", 100);
            var unauthorizedResult = (UnauthorizedResult)result;
            unauthorizedResult.StatusCode.Should().Be(401);
        }

        [Test]
        public void Should_throw_exception_for_booking_list_and_returns_bad_result()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            _bookingsApiClient.Setup(x => x.GetHearingsByTypes(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>()))
                .Throws(new BookingsApiException("Error", 400, "response", null, null));

            var result = _controller.GetBookingsList("cursor", 100);
            var badResult = (BadRequestObjectResult)result;
            badResult.StatusCode.Should().Be(400);
        }

        [Test]
        public void Should_return_ok_for_booking_list_with_null_types_in_database()
        {
            SetupTestCase();
            List<CaseTypeResponse> response = null;
            _bookingsApiClient.Setup(s => s.GetCaseTypes()).Returns(response);

            var result = _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public void Should_return_ok_for_booking_list_with_empty_list_of_types()
        {
            SetupTestCase();

            var response = new List<CaseTypeResponse>();
            _bookingsApiClient.Setup(s => s.GetCaseTypes()).Returns(response);

            var result = _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }

        [Test]
        public void Should_return_ok_for_booking_list_if_no_parameters_case_types_are_matched_with_database_types()
        {
            SetupTestCase();
           
            var response = new List<CaseTypeResponse>
            {
                new CaseTypeResponse
                {
                    Hearing_types = new List<HearingTypeResponse>(), Id=1, Name="type3"
                },
                new CaseTypeResponse
                {
                    Hearing_types = new List<HearingTypeResponse>(), Id=2, Name="type4"
                }
            };

            _bookingsApiClient.Setup(s => s.GetCaseTypes()).Returns(response);

            var result = _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
        }


        [Test]
        public void Should_return_ok_for_booking_list_with_defined_types_list()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            var hearingTypesIds = new List<int> { 1, 2 };
            _bookingsApiClient.Setup(x => x.GetHearingsByTypes(hearingTypesIds, It.IsAny<string>(), It.IsAny<int>()))
                  .Returns(new BookingsResponse());
            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2" });
            var response = GetCaseTypesList();
           
            _bookingsApiClient.Setup(s => s.GetCaseTypes()).Returns(response);

            var result = _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.GetHearingsByTypes(hearingTypesIds, "cursor", 100), Times.Once);
        }

        [Test]
        public void Should_return_ok_for_booking_list_and_exclude_repeted_types()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            var hearingTypesIds = new List<int> { 1, 2 };
            _bookingsApiClient.Setup(x => x.GetHearingsByTypes(hearingTypesIds, It.IsAny<string>(), It.IsAny<int>()))
                  .Returns(new BookingsResponse());
            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2","type2" });
            var response = GetCaseTypesList();
            
            _bookingsApiClient.Setup(s => s.GetCaseTypes()).Returns(response);

            var result = _controller.GetBookingsList("cursor", 100);
            var okResult = (OkObjectResult)result;
            okResult.StatusCode.Should().Be(200);
            _bookingsApiClient.Verify(x => x.GetHearingsByTypes(hearingTypesIds, "cursor", 100), Times.Once);
        }


        private void GivenApiThrowsExceptionOnGetHearing(HttpStatusCode code)
        {
            _bookingsApiClient.Setup(x => x.GetHearingDetailsById(It.IsAny<Guid>()))
                .Throws(ClientException.ForBookingsAPI(code));
        }

        private List<CaseTypeResponse> GetCaseTypesList()
        {
            return new List<CaseTypeResponse>
            {
                new CaseTypeResponse
                {
                    Hearing_types = new List<HearingTypeResponse>(), Id=1, Name="type1"
                },
                new CaseTypeResponse
                {
                    Hearing_types = new List<HearingTypeResponse>(), Id=2, Name="type2"
                },
                new CaseTypeResponse
                {
                    Hearing_types = new List<HearingTypeResponse>(), Id=3, Name="type3"
                }
            };
        }
        private void SetupTestCase()
        {
            _userIdentity.Setup(x => x.IsAdministratorRole()).Returns(true);
            _userIdentity.Setup(x => x.GetGroupDisplayNames()).Returns(new List<string> { "type1", "type2" });
            _bookingsApiClient.Setup(x => x.GetHearingsByTypes(It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<int>()))
                  .Returns(new BookingsResponse());
        }

    }
}
