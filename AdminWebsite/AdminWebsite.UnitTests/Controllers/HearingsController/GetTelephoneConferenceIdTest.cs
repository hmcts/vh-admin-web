using AdminWebsite.Models;
using AdminWebsite.Services;
using Autofac.Extras.Moq;
using Microsoft.AspNetCore.Mvc;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class GetTelephoneConferenceIdTest
    {
        private ConferenceDetailsResponse _conference;
        private AdminWebsite.Controllers.HearingsController _controller;
        private Guid _guid;
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();

            _guid = Guid.NewGuid();
            _conference = new ConferenceDetailsResponse
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
            };
            _mocker.Mock<IConferenceDetailsService>().Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>(), true))
                .ReturnsAsync(_conference);
            
            _controller = _mocker.Create<AdminWebsite.Controllers.HearingsController>();
        }

        [Test]
        public void Should_return_ok_status_and_telephone_conference_id_if_hearing_is_confirmed()
        {
            
            var result = _controller.GetTelephoneConferenceIdById(_guid);
            var okRequestResult = (OkObjectResult)result.Result;
            okRequestResult.StatusCode.Should().Be(200);

            var phoneDetails = (PhoneConferenceResponse)((OkObjectResult)result.Result).Value;
            phoneDetails.TelephoneConferenceId.Should().Be(_conference.MeetingRoom.TelephoneConferenceId);
        }

        [Test]
        public void Should_return_not_found_if_no_meeting_room_exists()
        {
            _conference.MeetingRoom.PexipNode = null;
            _mocker.Mock<IVideoApiClient>().Setup(x => x.GetConferenceDetailsByHearingRefIdsAsync(It.IsAny<GetConferencesByHearingIdsRequest>())).ReturnsAsync([_conference]);
            var result = _controller.GetTelephoneConferenceIdById(_guid);
            var okRequestResult = (NotFoundResult)result.Result;
            okRequestResult.StatusCode.Should().Be(404);
        }

        [Test]
        public void Should_return_bad_request_if_exceptions_is_thrown()
        {
            _mocker.Mock<IConferenceDetailsService>().Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>(), true)).Throws(new VideoApiException("Error", 400, null, null, null));
            
            var result = _controller.GetTelephoneConferenceIdById(_guid);
            var okRequestResult = (BadRequestObjectResult)result.Result;
            okRequestResult.StatusCode.Should().Be(400);
        }

        [Test]
        public void Should_return_not_found_if_exceptions_is_thrown()
        {
            _mocker.Mock<IConferenceDetailsService>().Setup(x => x.GetConferenceDetailsByHearingId(It.IsAny<Guid>(), true))
                .Throws(new VideoApiException("Error", 404, null, null, null));

            var result = _controller.GetTelephoneConferenceIdById(_guid);
            var notFoundResult = (NotFoundResult)result.Result;
            notFoundResult.StatusCode.Should().Be(404);
        }
    }
}
