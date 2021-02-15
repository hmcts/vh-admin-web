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
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using VideoApi.Client;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class SearchForAudioRecordedHearingsTests
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
                _hearingsService);

            _vhExistingHearing = new HearingDetailsResponse
            {
                Cases = new List<BookingsAPI.Client.CaseResponse>()
                {
                    new BookingsAPI.Client.CaseResponse()
                        {Name = "BBC vs ITV", Number = "TX/12345/2019", Is_lead_case = false}
                },
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
                    new ParticipantResponse()
                    {
                        Case_role_name = "Judge", Contact_email = "Judge.Lumb@madeupemail.com",
                        Display_name = "Judge Lumb", First_name = "Judge", Hearing_role_name = "Judge",
                        Last_name = "Lumb", Middle_names = string.Empty, Telephone_number = string.Empty,
                        Title = "Judge", Username = "Judge.Lumb@madeupemail.com"
                    },
                    new ParticipantResponse()
                    {
                        Case_role_name = "Claimant", Contact_email = "test.claimaint@emailaddress.net",
                        Display_name = "Test Claimaint", First_name = "Test", Hearing_role_name = "Litigant in person",
                        Last_name = "Claimaint", Middle_names = string.Empty, Telephone_number = string.Empty,
                        Title = "Mr", Username = "Test.Claimaint@madeupemail.com"
                    },
                    new ParticipantResponse()
                    {
                        Case_role_name = "Defendant", Contact_email = "test.defendant@emailaddress.net",
                        Display_name = "Test Defendant", First_name = "Test", Hearing_role_name = "Representative",
                        Last_name = "Defendant", Middle_names = string.Empty, Telephone_number = string.Empty,
                        Title = "Mr", Username = "Test.Defendant@madeupemail.com"
                    },
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
        public async Task Should_return_bad_request_when_booking_api_throws()
        {
            _bookingsApiClient.Setup(x => x.SearchForHearingsAsync(It.IsAny<string>(), It.IsAny<DateTime?>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var result = await _controller.SearchForAudioRecordedHearingsAsync("bad", DateTime.Today);
            var badRequestResult = (BadRequestObjectResult) result;
            badRequestResult.StatusCode.Should().Be(400);
        }

        [Test]
        public void Should_return_throw_when_booking_api_throws()
        {
            _bookingsApiClient.Setup(x => x.SearchForHearingsAsync(It.IsAny<string>(), It.IsAny<DateTime?>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));

            Assert.ThrowsAsync<BookingsApiException>(() =>
                _controller.SearchForAudioRecordedHearingsAsync("bad", DateTime.Today));
        }

        [TestCase("Perf692831/69", "Perf692831%2F69")]
        [TestCase("abc/123", "abc%2F123")]
        [TestCase("abc\\123", "abc%5C123")]
        [TestCase("abc-123", "abc-123")]
        [TestCase("abc-123/456\\789", "abc-123%2F456%5C789")]
        public async Task Should_return_ok(string caseNumberDecoded, string caseNumberEncoded)
        {
            var bookingApiResponse = new List<AudioRecordedHearingsBySearchResponse>
            {
                new AudioRecordedHearingsBySearchResponse {Id = Guid.NewGuid()},
                new AudioRecordedHearingsBySearchResponse {Id = Guid.NewGuid()},
                new AudioRecordedHearingsBySearchResponse {Id = Guid.NewGuid()}
            };

            _bookingsApiClient.Setup(x => x.SearchForHearingsAsync(caseNumberDecoded, It.IsAny<DateTime?>()))
                .ReturnsAsync(bookingApiResponse);

            var result = await _controller.SearchForAudioRecordedHearingsAsync(caseNumberEncoded, DateTime.Today);
            var actionResult = (OkObjectResult)result;
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be(200);
            var items = actionResult.Value.As<IEnumerable<HearingsForAudioFileSearchResponse>>().ToList();
            items.Should().NotBeNullOrEmpty().And.HaveCount(3);
        }
    }
}