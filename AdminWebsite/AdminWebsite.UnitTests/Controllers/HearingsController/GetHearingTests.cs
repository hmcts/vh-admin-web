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
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.Enums;
using BookingsApi.Contract.Responses;
using VideoApi.Client;
using Microsoft.Extensions.Options;
using AdminWebsite.Configuration;
using Autofac.Extras.Moq;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class GetHearingTests
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
        public async Task Should_return_ok_status_if_hearing_id_is_valid()
        {
            // Arrange
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_vhExistingHearing);

            // Act
            var result = await _controller.GetHearingById(_guid);
            
            // Assert
            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);

            var hearing = (HearingDetailsResponse) ((OkObjectResult) result).Value;
            hearing.Id.Should().Be(_vhExistingHearing.Id);
        }

        [Test]
        public async Task Should_return_bad_request_if_hearing_id_is_empty()
        {
            // Arrange
            GivenApiThrowsExceptionOnGetHearing(HttpStatusCode.BadRequest);

            var invalidId = Guid.Empty;
            
            // Act
            var result = await _controller.GetHearingById(invalidId);
            
            // Assert
            var badRequestResult = (BadRequestObjectResult) result;
            badRequestResult.StatusCode.Should().Be(400);
        }

        private void GivenApiThrowsExceptionOnGetHearing(HttpStatusCode code)
        {
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(ClientException.ForBookingsAPI(code));
        }
    }
}
