using AdminWebsite.Models;
using AdminWebsite.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests.Enums;
using Autofac.Extras.Moq;
using BookingsApi.Contract.V1.Responses;
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
            _mocker.Mock<IBookingsApiClient>().Setup(bs => bs.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(new HearingDetailsResponse
                {
                    Participants = new List<ParticipantResponse>
                    {
                        new ParticipantResponse {HearingRoleName = "Judge"}
                    }
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
    }
}
