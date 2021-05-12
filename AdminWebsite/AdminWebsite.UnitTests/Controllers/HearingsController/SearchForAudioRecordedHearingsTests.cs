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
using BookingsApi.Client;
using BookingsApi.Contract.Enums;
using BookingsApi.Contract.Responses;
using VideoApi.Client;
using AdminWebsite.Configuration;
using Autofac.Extras.Moq;
using Microsoft.Extensions.Options;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class SearchForAudioRecordedHearingsTests
    {
        private AutoMock _mocker;
        private AdminWebsite.Controllers.HearingsController _controller;
        
        private Guid _guid;
        private HearingDetailsResponse _vhExistingHearing;


        [SetUp]
        public void Setup()
        {
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
            
            _controller = _mocker.Create<AdminWebsite.Controllers.HearingsController>();
            InitialiseHearing();
        }

        public void InitialiseHearing()
        {
            _guid = Guid.NewGuid();
            _vhExistingHearing = new HearingDetailsResponse
            {
                Cases = new List<BookingsApi.Contract.Responses.CaseResponse>()
                {
                    new BookingsApi.Contract.Responses.CaseResponse()
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
                        CaseRoleName = "Judge", ContactEmail = "Judge.Lumb@hmcts.net",
                        DisplayName = "Judge Lumb", FirstName = "Judge", HearingRoleName = "Judge",
                        LastName = "Lumb", MiddleNames = string.Empty, TelephoneNumber = string.Empty,
                        Title = "Judge", Username = "Judge.Lumb@hmcts.net"
                    },
                    new ParticipantResponse()
                    {
                        CaseRoleName = "Applicant", ContactEmail = "test.Applicant@hmcts.net",
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
        public async Task Should_return_bad_request_when_booking_api_throws()
        {
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.SearchForHearingsAsync(It.IsAny<string>(), It.IsAny<DateTimeOffset>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.BadRequest));

            var result = await _controller.SearchForAudioRecordedHearingsAsync("bad", DateTime.Today);
            var badRequestResult = (BadRequestObjectResult) result;
            badRequestResult.StatusCode.Should().Be(400);
        }

        [Test]
        public void Should_return_throw_when_booking_api_throws()
        {
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.SearchForHearingsAsync(It.IsAny<string>(), It.IsAny<DateTimeOffset>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));

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

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.SearchForHearingsAsync(caseNumberDecoded, It.IsAny<DateTimeOffset>()))
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