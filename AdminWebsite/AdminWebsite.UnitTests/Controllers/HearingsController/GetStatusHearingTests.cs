using AdminWebsite.Models;
using AdminWebsite.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.Enums;
using BookingsApi.Contract.Responses;
using VideoApi.Client;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class GetStatusHearingTests
    {
        private AdminWebsite.Controllers.HearingsController _controller;
        
        private HearingDetailsResponse _vhExistingHearing;
        private Guid _guid;
        
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            
            _mocker = AutoMock.GetLoose();
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
                Participants = new List<ParticipantResponse>
                {
                    new()
                    {
                        CaseRoleName = "Judge", ContactEmail = "Judge.Lumb@hmcts.net", DisplayName = "Judge Lumb",
                        FirstName = "Judge", HearingRoleName = "Judge", LastName = "Lumb", MiddleNames = string.Empty,
                        TelephoneNumber = string.Empty, Title = "Judge", Username = "Judge.Lumb@hmcts.net"
                    },
                    new()
                    {
                        CaseRoleName = "Applicant", ContactEmail = "test.applicant@hmcts.net",
                        DisplayName = "Test Applicant", FirstName = "Test", HearingRoleName = "Litigant in person",
                        LastName = "Applicant", MiddleNames = string.Empty, TelephoneNumber = string.Empty,
                        Title = "Mr", Username = "Test.Applicant@hmcts.net"
                    },
                    new()
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

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
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
            _mocker.Mock<IConferenceDetailsService>()
                .Setup(x => x.GetConferenceDetailsByHearingId(_guid))
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
            
            ConferenceDetailsResponse conferenceResponse = new ConferenceDetailsResponse();
            conferenceResponse.MeetingRoom = new MeetingRoomResponse();
            
            
            // Arrange
            _mocker.Mock<IConferenceDetailsService>()
                .Setup(x => x.GetConferenceDetailsByHearingId(It.IsAny<Guid>()))
                .ReturnsAsync(conferenceResponse);

            // Act
            var result = await _controller.GetHearingConferenceStatus(_guid);
            
            // Assert
            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);

            var hearing = (UpdateBookingStatusResponse) ((OkObjectResult) result).Value;
            hearing.Success.Should().Be(false);
        }
        
        [Test]
        public async Task Should_return_not_found_if_hearing_has_not_be_found()
        {
            
            ConferenceDetailsResponse conferenceResponse = new ConferenceDetailsResponse();
            conferenceResponse.MeetingRoom = new MeetingRoomResponse();
            
            
            // Arrange
            _mocker.Mock<IConferenceDetailsService>()
                .Setup(x => x.GetConferenceDetailsByHearingId(It.IsAny<Guid>()))
                .Throws(new VideoApiException("Error", 404, null, null, null));

            // Act
            var result = await _controller.GetHearingConferenceStatus(_guid);
            
            // Assert
            var notFoundResult = (OkObjectResult)result;
            notFoundResult.StatusCode.Should().Be(200);
            ((UpdateBookingStatusResponse) notFoundResult.Value)?.Success.Should().BeFalse();
        }
        
        [Test]
        public async Task Should_return_BadRequest_if_hearing_has_not_be_found()
        {
            
            ConferenceDetailsResponse conferenceResponse = new ConferenceDetailsResponse();
            conferenceResponse.MeetingRoom = new MeetingRoomResponse();
            
            
            // Arrange
            _mocker.Mock<IConferenceDetailsService>()
                .Setup(x => x.GetConferenceDetailsByHearingId(It.IsAny<Guid>()))
                .Throws(new VideoApiException("Error", 400, null, null, null));

            // Act
            var result = await _controller.GetHearingConferenceStatus(_guid);
            
            // Assert
            var notFoundResult = (BadRequestObjectResult)result;
            notFoundResult.StatusCode.Should().Be(400);
        } 

        [Test]
        public async Task Should_return_not_found_if_hearing_failed_to_update()
        {
            // Arrange
            _mocker.Mock<IHearingsService>()
                .Setup(x => x.UpdateFailedBookingStatus(_guid))
                .ThrowsAsync(new VideoApiException("Error", 404, null, null, null));
            
            // Act
            var result = await _controller.UpdateHearingStatus(_guid);
            
            // Assert
            _mocker.Mock<IHearingsService>().Verify(x => x.UpdateFailedBookingStatus(_guid), Times.AtLeastOnce);
            var notFoundResult = (NotFoundResult)result;
            notFoundResult.StatusCode.Should().Be(404);
        }
        
        [Test]
        public async Task Should_return_badRequest_if_hearing_failed_to_update()
        {
            // Arrange
            _mocker.Mock<IHearingsService>()
                .Setup(x => x.UpdateFailedBookingStatus(_guid))
                .ThrowsAsync(new VideoApiException("Error", 400, null, null, null));
            
            // Act
            var result = await _controller.UpdateHearingStatus(_guid);
            
            // Assert
            _mocker.Mock<IHearingsService>().Verify(x => x.UpdateFailedBookingStatus(_guid), Times.AtLeastOnce);
            var notFoundResult = (BadRequestObjectResult)result;
            notFoundResult.StatusCode.Should().Be(400);
        }
        
        [Test]
        public async Task Should_return_ok_status_after_update_hearing()
        {
            // Arrange
            // Act
            var result = await _controller.UpdateHearingStatus(_guid);
            
            // Assert
            
            _mocker.Mock<IHearingsService>().Verify(
                x => x.UpdateFailedBookingStatus(It.IsAny<Guid>()),
                Times.Exactly(1));

            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);

            var hearing = (UpdateBookingStatusResponse) ((OkObjectResult) result).Value;
            hearing.Success.Should().Be(false);
        }
    }
}
