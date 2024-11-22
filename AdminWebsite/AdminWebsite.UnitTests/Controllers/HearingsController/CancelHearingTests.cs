using System.Net;
using AdminWebsite.Models;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using BookingsApi.Client;
using Autofac.Extras.Moq;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class CancelHearingTests
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
            _mocker.Mock<IBookingsApiClient>().Setup(bs => bs.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(new HearingDetailsResponseV2()
                {
                    Participants = [new ParticipantResponseV2 { HearingRoleName = HearingRoleName.Representative }]
                });
            _controller = _mocker.Create<AdminWebsite.Controllers.HearingsController>();
        }

        [Test]
        public async Task Should_update_status_of_hearing_to_cancelled_given_status_and_updatedby()
        {
            // Arrange
            var bookingGuid = Guid.NewGuid();
            // Act
            var response = await _controller.CancelBooking(bookingGuid, "Reason");

            // Assert
            var result = response as OkObjectResult;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);

            result.Value.Should().NotBeNull()
                                 .And.BeAssignableTo<UpdateBookingStatusResponse>()
                                 .Subject.Success.Should().BeTrue();
        }

        [Test]
        public async Task Should_return_bad_request_when_bookings_api_returns_bad_request()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var exception = new BookingsApiException<string>("BadRequest", 
                (int)HttpStatusCode.BadRequest,
                "BadRequest",
                null,
                "BadRequest",
                null);
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.CancelBookingAsync(bookingId, It.IsAny<CancelBookingRequest>()))
                .ThrowsAsync(exception);
            
            // Act
            var response = await _controller.CancelBooking(bookingId, "Reason");

            // Assert
            var result = response as BadRequestObjectResult;
            result.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        }
        
        [Test]
        public async Task Should_return_not_found_when_bookings_api_returns_not_found()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var exception = new BookingsApiException<string>("NotFound", 
                (int)HttpStatusCode.NotFound,
                "NotFound",
                null,
                "NotFound",
                null);
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.CancelBookingAsync(bookingId, It.IsAny<CancelBookingRequest>()))
                .ThrowsAsync(exception);
            
            // Act
            var response = await _controller.CancelBooking(bookingId, "Reason");

            // Assert
            var result = response as NotFoundObjectResult;
            result.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        }
        
        [Test]
        public async Task Should_return_bad_request_when_bookings_api_returns_forbidden()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var exception = new BookingsApiException<string>("Forbidden", 
                (int)HttpStatusCode.Forbidden,
                "Forbidden",
                null,
                "Forbidden",
                null);
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.CancelBookingAsync(bookingId, It.IsAny<CancelBookingRequest>()))
                .ThrowsAsync(exception);
            
            // Act
            var response = await _controller.CancelBooking(bookingId, "Reason");

            // Assert
            var result = response as ObjectResult;
            result.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        }

        [Test]
        public async Task Should_return_bad_request_when_other_exception_thrown()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var exception = new InvalidOperationException();
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.CancelBookingAsync(bookingId, It.IsAny<CancelBookingRequest>()))
                .ThrowsAsync(exception);
            
            // Act
            var response = await _controller.CancelBooking(bookingId, "Reason");

            // Assert
            var result = response as ObjectResult;
            result.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        }
    }
}
