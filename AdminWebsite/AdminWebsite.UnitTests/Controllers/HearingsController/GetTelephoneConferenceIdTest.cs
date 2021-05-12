using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NotificationApi.Client;
using NUnit.Framework;
using System;
using BookingsApi.Client;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using Microsoft.Extensions.Options;
using AdminWebsite.Configuration;
using Autofac.Extras.Moq;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class GetTelephoneConferenceIdTest
    {
        private AutoMock _mocker;
        private AdminWebsite.Controllers.HearingsController _controller;
        private ConferenceDetailsResponse _conference;
        private Guid _guid;

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
            _mocker.Mock<IConferenceDetailsService>().Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>()))
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
            _mocker.Mock<IVideoApiClient>().Setup(x => x.GetConferenceByHearingRefIdAsync(It.IsAny<Guid>(), It.IsAny<Boolean>())).ReturnsAsync(_conference);
            var result = _controller.GetTelephoneConferenceIdById(_guid);
            var okRequestResult = (NotFoundResult)result.Result;
            okRequestResult.StatusCode.Should().Be(404);
        }

        [Test]
        public void Should_return_bad_request_if_exceptions_is_thrown()
        {
            _mocker.Mock<IConferenceDetailsService>().Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>())).Throws(new VideoApiException("Error", 400, null, null, null));
            
            var result = _controller.GetTelephoneConferenceIdById(_guid);
            var okRequestResult = (BadRequestObjectResult)result.Result;
            okRequestResult.StatusCode.Should().Be(400);
        }

        [Test]
        public void Should_return_not_found_if_exceptions_is_thrown()
        {
            _mocker.Mock<IConferenceDetailsService>().Setup(x => x.GetConferenceDetailsByHearingId(It.IsAny<Guid>()))
                .Throws(new VideoApiException("Error", 404, null, null, null));

            var result = _controller.GetTelephoneConferenceIdById(_guid);
            var notFoundResult = (NotFoundResult)result.Result;
            notFoundResult.StatusCode.Should().Be(404);
        }
    }
}
