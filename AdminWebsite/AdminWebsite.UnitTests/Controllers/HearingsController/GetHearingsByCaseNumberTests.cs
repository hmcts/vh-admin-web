using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class GetHearingsByCaseNumberTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IUserAccountService> _userAccountService;
        private Mock<IValidator<BookNewHearingRequest>> _bookNewHearingRequestValidator;
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;

        private AdminWebsite.Controllers.HearingsController _controller;
        private HearingDetailsResponse _vhExistingHearing;
        private readonly Guid _guid = Guid.NewGuid();

        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _userAccountService = new Mock<IUserAccountService>();
            _bookNewHearingRequestValidator = new Mock<IValidator<BookNewHearingRequest>>();
            _editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _userAccountService.Object,
                _bookNewHearingRequestValidator.Object,
                _editHearingRequestValidator.Object,
                JavaScriptEncoder.Default);

            _vhExistingHearing = new HearingDetailsResponse
            {
                Cases = new List<BookingsAPI.Client.CaseResponse>() {new BookingsAPI.Client.CaseResponse() {Name = "BBC vs ITV", Number = "TX/12345/2019", Is_lead_case = false}},
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
                    new ParticipantResponse() {Case_role_name = "Judge", Contact_email = "Judge.Lumb@hearings.reform.hmcts.net", Display_name = "Judge Lumb", First_name = "Judge", Hearing_role_name = "Judge", Last_name = "Lumb", Middle_names = string.Empty, Telephone_number = string.Empty, Title = "Judge", Username = "Judge.Lumb@hearings.reform.hmcts.net"},
                    new ParticipantResponse() {Case_role_name = "Claimant", Contact_email = "test.claimaint@emailaddress.net", Display_name = "Test Claimaint", First_name = "Test", Hearing_role_name = "Claimant LIP", Last_name = "Claimaint", Middle_names = string.Empty, Telephone_number = string.Empty, Title = "Mr", Username = "Test.Claimaint@hearings.reform.hmcts.net"},
                    new ParticipantResponse() {Case_role_name = "Defendant", Contact_email = "test.defendant@emailaddress.net", Display_name = "Test Defendant", First_name = "Test", Hearing_role_name = "Representative", Last_name = "Defendant", Middle_names = string.Empty, Telephone_number = string.Empty, Title = "Mr", Username = "Test.Defendant@hearings.reform.hmcts.net"},
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
        
        [TestCase(null)]
        [TestCase("")]
        [TestCase(" ")]
        public async Task Should_return_bad_request_when_case_number_is_null_empty_whitespace(string caseNumber)
        {
            var result = await _controller.GetHearingsByCaseNumberAsync(caseNumber);
            var badRequestResult = (BadRequestObjectResult)result;
            badRequestResult.StatusCode.Should().Be(400);
        }
        
        [Test]
        public async Task Should_return_bad_request_when_booking_api_throws()
        {
            _bookingsApiClient.Setup(x => x.GetHearingsByCaseNumberAsync(It.IsAny<string>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var result = await _controller.GetHearingsByCaseNumberAsync("bad");
            var badRequestResult = (BadRequestObjectResult)result;
            badRequestResult.StatusCode.Should().Be(400);
        }
        
        [Test]
        public void Should_return_throw_when_booking_api_throws()
        {
            _bookingsApiClient.Setup(x => x.GetHearingsByCaseNumberAsync(It.IsAny<string>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));

            Assert.ThrowsAsync<BookingsApiException>(() => _controller.GetHearingsByCaseNumberAsync("bad"));
        }
        
        [Test]
        public async Task Should_return_ok()
        {
            var bookingApiResponse = new List<HearingsByCaseNumberResponse>
            {
                new HearingsByCaseNumberResponse{Id = Guid.NewGuid()},
                new HearingsByCaseNumberResponse{Id = Guid.NewGuid()},
                new HearingsByCaseNumberResponse{Id = Guid.NewGuid()}
            };
            
            _bookingsApiClient.Setup(x => x.GetHearingsByCaseNumberAsync(It.IsAny<string>()))
                .ReturnsAsync(bookingApiResponse);

            var result = await _controller.GetHearingsByCaseNumberAsync("good");
            var actionResult = (OkObjectResult)result;
            actionResult.StatusCode.Should().Be(200);
            var objects = actionResult.Value.As<IEnumerable<HearingsForAudioFileSearchResponse>>().ToList();
            objects.Should().NotBeNullOrEmpty().And.HaveCount(3);
        }
    }
}