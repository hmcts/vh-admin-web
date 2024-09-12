using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VideoApi.Contract.Responses;
using ParticipantResponse = BookingsApi.Contract.V1.Responses.ParticipantResponse;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class FailHearingTests
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
                    Participants = [new ParticipantResponse { HearingRoleName = "Judge" }]
                });
            _controller = _mocker.Create<AdminWebsite.Controllers.HearingsController>();
        }
        
        [Test]
        public async Task UpdateBookingStatus_returns_success_response_when_status_not_failed()
        {
            _mocker.Mock<IUserIdentity>().Setup(x => x.GetUserIdentityName()).Returns("test");
            var hearingId = Guid.NewGuid();

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.FailBookingAsync(hearingId));

            var response = await _controller.UpdateFailedBookingStatus(hearingId);

            var result = (OkObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeTrue();

            _mocker.Mock<IBookingsApiClient>().Verify(x => x.FailBookingAsync(hearingId), Times.Once);
        }

    }
}