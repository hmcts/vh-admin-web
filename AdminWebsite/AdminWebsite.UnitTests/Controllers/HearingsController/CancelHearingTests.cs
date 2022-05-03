using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NotificationApi.Client;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Requests.Enums;
using VideoApi.Client;
using Microsoft.Extensions.Options;
using AdminWebsite.Configuration;
using Autofac.Extras.Moq;
using BookingsApi.Contract.Responses;
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
            var updateBookingStatusRequest = new UpdateBookingStatusRequest {
                Status = UpdateBookingStatus.Cancelled, 
                UpdatedBy = "admin user"
            };
            
            // Act
            var response = await _controller.UpdateBookingStatus(bookingGuid, updateBookingStatusRequest);
            
            // Assert
            var result = response as OkObjectResult;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            
            result.Value.Should().NotBeNull()
                                 .And.BeAssignableTo<UpdateBookingStatusResponse>()
                                 .Subject.Success.Should().BeTrue();
        }
    }
}
