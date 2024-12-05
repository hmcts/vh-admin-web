using System.Linq;
using AdminWebsite.Models;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Requests;
using BookingsApi.Client;
using Autofac.Extras.Moq;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Responses;
using ParticipantRequest = AdminWebsite.Contracts.Requests.ParticipantRequest;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class PostHearingTests
    {
        private AutoMock _mocker;
        private AdminWebsite.Controllers.HearingsController _controller;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();

            _mocker.Mock<IConferenceDetailsService>().Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>(), false))
                .ReturnsAsync(new ConferenceDetailsResponse
                {
                    MeetingRoom = new ()
                    {
                        AdminUri = "AdminUri",
                        JudgeUri = "JudgeUri",
                        ParticipantUri = "ParticipantUri",
                        PexipNode = "PexipNode",
                        PexipSelfTestNode = "PexipSelfTestNode",
                        TelephoneConferenceId = "expected_conference_phone_id"
                    }
                });
            _mocker.Mock<IBookingsApiClient>().Setup(bs => bs.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(new HearingDetailsResponseV2()
                {
                    Participants = new List<ParticipantResponseV2>
                    {
                        new () {HearingRoleName = "Judge"}
                    },
                    ServiceId = "Generic"
                });
            _controller = _mocker.Create<AdminWebsite.Controllers.HearingsController>();
        }
        
        [Test]
        public void Should_throw_BookingsApiException()
        {
            var hearing = new BookingDetailsRequest()
            {
                Participants = new List<ParticipantRequest>()
            };

            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = hearing
            };
            
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.BookNewHearingWithCodeAsync(It.IsAny<BookNewHearingRequestV2>()))
                .Throws(ClientException.ForBookingsAPI(HttpStatusCode.InternalServerError));

            var response = _controller.Post(bookingRequest);

            ((ObjectResult) response.Result.Result).StatusCode.Should().Be(500);
        }
        
        [Test]
        public void Should_throw_Exception()
        {
            var hearing = new BookingDetailsRequest
            {
                Participants = new List<ParticipantRequest>()
            };
            
            var bookingRequest = new BookHearingRequest
            {
                BookingDetails = hearing
            };

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.BookNewHearingWithCodeAsync(It.IsAny<BookNewHearingRequestV2>()))
                .Throws(new Exception("Some internal error"));
            
            var response = _controller.Post(bookingRequest);

            ((ObjectResult) response.Result.Result).StatusCode.Should().Be(500);
        }
        
        [Test]
        public async Task Should_clone_hearing()
        {
            var request = GetMultiHearingRequest();
            request.ScheduledDuration = 120;
            var groupedHearings = new List<HearingDetailsResponseV2>
            {
                new()
                {
                    Status = BookingStatusV2.Booked,
                    GroupId = Guid.NewGuid(),
                    Id = Guid.NewGuid(),
                }
            };

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(groupedHearings);

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.CloneHearingAsync(It.IsAny<Guid>(), It.IsAny<CloneHearingRequestV2>()))
                .Verifiable();

            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IBookingsApiClient>().Verify(
                x => x.CloneHearingAsync(It.IsAny<Guid>(), It.Is<CloneHearingRequestV2>(
                    y => y.ScheduledDuration == request.ScheduledDuration)),
                Times.Exactly(1));
        }

        [Test]
        public async Task Should_clone_and_confirm_hearing_for_large_booking()
        {
            var request = GetMultiHearingRequest();
            var hearingGroupId = Guid.NewGuid();
            var groupedHearings = new List<HearingDetailsResponseV2>();
            var batchSize = 30;
            for (var i = 1; i <= batchSize; i++)
            {
                groupedHearings.Add(new HearingDetailsResponseV2
                {
                    Status = BookingStatusV2.Booked,
                    GroupId = hearingGroupId,
                    Id = Guid.NewGuid()
                });
            }
            
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(groupedHearings);

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.CloneHearingAsync(It.IsAny<Guid>(), It.IsAny<CloneHearingRequestV2>()))
                .Verifiable();
            
            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<NoContentResult>();
            
            _mocker.Mock<IBookingsApiClient>().Verify(
                x => x.CloneHearingAsync(It.IsAny<Guid>(), It.IsAny<CloneHearingRequestV2>()),
                Times.Exactly(1));
        }

        [Test]
        public async Task Should_return_bad_request_status_if_no_items_in_the_date_list()
        {
            var startDate = new DateTime(2020, 10, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = new DateTime(2020, 10, 1, 0, 0, 0, DateTimeKind.Utc);
            var request = new MultiHearingRequest { StartDate = startDate, EndDate = endDate};


            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<BadRequestResult>();
        }

        [Test]
        public async Task Should_catch_BookingsApiException_by_clone_hearing()
        {
            var request = GetMultiHearingRequest();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.CloneHearingAsync(It.IsAny<Guid>(), It.IsAny<CloneHearingRequestV2>()))
                .Throws(new BookingsApiException("Error", (int)HttpStatusCode.BadRequest, "response", null, null));

            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<BadRequestObjectResult>();
        }
        
        [Test]
        public async Task Should_catch_InternalError_by_clone_hearing()
        {
            var request = GetMultiHearingRequest();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.CloneHearingAsync(It.IsAny<Guid>(), It.IsAny<CloneHearingRequestV2>()))
                .Throws(new BookingsApiException("Error", (int)HttpStatusCode.InternalServerError, "response", null, null));

            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            ((ObjectResult) response).StatusCode.Should().Be(500);
        }

        [TestCase("2023-01-07", "2023-01-09")]
        [TestCase("2023-01-08", "2023-01-09")]
        [TestCase("2023-01-06", "2023-01-07")]
        [TestCase("2023-01-06", "2023-01-08")]
        public async Task Should_clone_hearings_on_weekends_when_start_or_end_date_are_on_weekends(DateTime startDate, DateTime endDate)
        {
            var request = new MultiHearingRequest { StartDate = startDate, EndDate = endDate};
            var groupedHearings = new List<HearingDetailsResponseV2>
            {
                new()
                {
                    Status = BookingStatusV2.Booked,
                    GroupId = Guid.NewGuid(),
                    Id = Guid.NewGuid(),
                }
            };
            
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(groupedHearings);
            
            var expectedDates = new List<DateTime>();
            for (var date = startDate.AddDays(1); date <= endDate; date = date.AddDays(1))
            {
                expectedDates.Add(date);
            }
            
            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IBookingsApiClient>().Verify(
                x => x.CloneHearingAsync(It.IsAny<Guid>(), 
                    It.Is<CloneHearingRequestV2>(r => r.Dates.All(d => expectedDates.Contains(d)))),
                Times.Exactly(1));
        }
        
        [Test]
        public async Task Should_not_clone_hearings_on_weekends_when_start_or_end_date_are_on_weekdays()
        {
            var startDate = new DateTime(2022, 12, 15, 0, 0, 0, DateTimeKind.Utc);
            var endDate = new DateTime(2022, 12, 20, 0, 0, 0, DateTimeKind.Utc);
            var request = new MultiHearingRequest { StartDate = startDate, EndDate = endDate};
            var groupedHearings = new List<HearingDetailsResponseV2>
            {
                new()
                {
                    Status = BookingStatusV2.Booked,
                    GroupId = Guid.NewGuid(),
                    Id = Guid.NewGuid(),
                }
            };
            
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(groupedHearings);

            var expectedDates = new List<DateTime>
            {
                new(2022, 12, 16, 0, 0, 0, DateTimeKind.Utc),
                new(2022, 12, 17, 0, 0, 0, DateTimeKind.Utc),
                new(2022, 12, 18, 0, 0, 0, DateTimeKind.Utc),
                new(2022, 12, 19, 0, 0, 0, DateTimeKind.Utc),
                new(2022, 12, 20, 0, 0, 0, DateTimeKind.Utc)
            };
            
            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IBookingsApiClient>().Verify(
                x => x.CloneHearingAsync(It.IsAny<Guid>(), 
                    It.Is<CloneHearingRequestV2>(r => r.Dates.All(d => expectedDates.Contains(d)))),
                Times.Exactly(1));
        }

        [Test]
        public async Task Should_clone_hearings_using_hearing_dates()
        {
            var hearingDates = new List<DateTime>
            {
                new (2023, 1, 6, 0, 0, 0, DateTimeKind.Utc),
                new (2023, 1, 7, 0, 0, 0, DateTimeKind.Utc),
                new (2023, 1, 8, 0, 0, 0, DateTimeKind.Utc)
            };
            var request = new MultiHearingRequest { HearingDates = hearingDates };
            var groupedHearings = new List<HearingDetailsResponseV2>
            {
                new()
                {
                    Status = BookingStatusV2.Booked,
                    GroupId = Guid.NewGuid(),
                    Id = Guid.NewGuid(),
                }
            };
            
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsByGroupIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(groupedHearings);

            var expectedDates = new List<DateTime>
            {
                new (2023, 1, 6, 0, 0, 0, DateTimeKind.Utc),
                new (2023, 1, 7, 0, 0, 0, DateTimeKind.Utc),
                new (2023, 1, 8, 0, 0, 0, DateTimeKind.Utc)
            };
            
            var response = await _controller.CloneHearing(Guid.NewGuid(), request);

            response.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IBookingsApiClient>().Verify(
                x => x.CloneHearingAsync(It.IsAny<Guid>(), 
                    It.Is<CloneHearingRequestV2>(r => r.Dates.All(d => expectedDates.Contains(d)))),
                Times.Exactly(1));
        }

        private static MultiHearingRequest GetMultiHearingRequest()
        {
            var startDate = new DateTime(2020, 10, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = new DateTime(2020, 10, 6, 0, 0, 0, DateTimeKind.Utc);
            return new MultiHearingRequest { StartDate = startDate, EndDate = endDate };
        }
    }
}