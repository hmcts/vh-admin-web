using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Extensions;
using BookingsApi.Client;
using BookingsApi.Contract.Enums;
using BookingsApi.Contract.Responses;
using Autofac.Extras.Moq;
using BookingsApi.Contract.Requests;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class GetStatusHearingTests
    {
        private AutoMock _mocker;
        private AdminWebsite.Controllers.HearingsController _controller;
        
        private HearingDetailsResponse _vhExistingHearing;
        private Guid _guid;

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

            Initialise();
        }
        
        public void Initialise()
        {
            _guid = Guid.NewGuid();
            _vhExistingHearing = new HearingDetailsResponse
            {
                Cases = new List<BookingsApi.Contract.Responses.CaseResponse>()
                {
                    new BookingsApi.Contract.Responses.CaseResponse
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
                        CaseRoleName = "Judge", ContactEmail = "Judge.Lumb@hmcts.net", DisplayName = "Judge Lumb",
                        FirstName = "Judge", HearingRoleName = "Judge", LastName = "Lumb", MiddleNames = string.Empty,
                        TelephoneNumber = string.Empty, Title = "Judge", Username = "Judge.Lumb@hmcts.net"
                    },
                    new ParticipantResponse()
                    {
                        CaseRoleName = "Applicant", ContactEmail = "test.applicant@hmcts.net",
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
        public async Task Should_return_ok_status_if_hearing_has_valid_room()
        {
            
            ConferenceDetailsResponse mock = new ConferenceDetailsResponse();
            mock.MeetingRoom = new MeetingRoomResponse();
            mock.MeetingRoom.AdminUri = "AdminUri";
            mock.MeetingRoom.ParticipantUri = "ParticipantUri";
            mock.MeetingRoom.JudgeUri = "JudgeUri";
            mock.MeetingRoom.PexipNode = "PexipNode";
            
            
            // Arrange
            _mocker.Mock<IConferenceDetailsService>().Setup(x => x.GetConferenceDetailsByHearingId(It.IsAny<Guid>()))
                .ReturnsAsync(mock);

            // Act
            var result = await _controller.GetHearingConferenceStatus(_guid);
            
            // Assert
            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);

            var hearing = (UpdateBookingStatusResponse) ((OkObjectResult) result).Value;
            hearing.Success.Should().Be(true);
        }
        
        [Test]
        public async Task Should_return_ok_status_if_hearing_has_not_valid_room()
        {
            
            ConferenceDetailsResponse mock = new ConferenceDetailsResponse();
            mock.MeetingRoom = new MeetingRoomResponse();
            
            
            // Arrange
            _mocker.Mock<IConferenceDetailsService>().Setup(x => x.GetConferenceDetailsByHearingId(It.IsAny<Guid>()))
                .ReturnsAsync(mock);

            // Act
            var result = await _controller.GetHearingConferenceStatus(_guid);
            
            // Assert
            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);

            var hearing = (UpdateBookingStatusResponse) ((OkObjectResult) result).Value;
            hearing.Success.Should().Be(false);
        }
        
        [Test]
        public async Task Should_return_ok_status_after_update_hearing()
        {
            
            
            // Arrange
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.UpdateBookingStatusAsync(It.IsAny<Guid>(), It.IsAny<UpdateBookingStatusRequest>()));

            // Act
            var result = await _controller.UpdateHearingStatus(_guid);
            
            // Assert
            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);

            var hearing = (UpdateBookingStatusResponse) ((OkObjectResult) result).Value;
            hearing.Success.Should().Be(false);
        }
    }
}
