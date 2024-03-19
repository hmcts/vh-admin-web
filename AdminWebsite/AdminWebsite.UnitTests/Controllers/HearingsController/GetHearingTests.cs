using AdminWebsite.Services;
using AdminWebsite.UnitTests.Helper;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Mappers;
using BookingsApi.Client;
using Autofac.Extras.Moq;
using BookingsApi.Contract.V1.Enums;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class GetHearingTests
    {
        private AutoMock _mocker;
        private AdminWebsite.Controllers.HearingsController _controller;
        
        private BookingsApi.Contract.V1.Responses.HearingDetailsResponse _vhExistingHearingV1;
        private Guid _v1HearingId;
        private Guid _v2HearingId;
        private HearingDetailsResponseV2 _vhExistingHearingV2;
        private Mock<IFeatureToggles> _featureToggle;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _featureToggle = new Mock<IFeatureToggles>();
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
            
            _controller = _mocker.Create<AdminWebsite.Controllers.HearingsController>();

            Initialise();
        }
        
        public void Initialise()
        {
            _v1HearingId = Guid.NewGuid();
            _vhExistingHearingV1 = new BookingsApi.Contract.V1.Responses.HearingDetailsResponse
            {
                Cases = new List<BookingsApi.Contract.V1.Responses.CaseResponse>()
                {
                    new BookingsApi.Contract.V1.Responses.CaseResponse
                        {Name = "BBC vs ITV", Number = "TX/12345/2019", IsLeadCase = false}
                },
                CaseTypeName = "Generic",
                CreatedBy = "CaseAdministrator",
                CreatedDate = DateTime.UtcNow,
                HearingRoomName = "Room 6.41D",
                HearingTypeName = "Automated Test",
                HearingVenueName = "Manchester Civil and Family Justice Centre",
                Id = _v1HearingId,
                OtherInformation = "Any other information about the hearing",
                Participants = new List<BookingsApi.Contract.V1.Responses.ParticipantResponse>()
                {
                    new ()
                    {
                        CaseRoleName = "Judge", ContactEmail = "Judge.Lumb@hmcts.net", DisplayName = "Judge Lumb",
                        FirstName = "Judge", HearingRoleName = "Judge", LastName = "Lumb", MiddleNames = string.Empty,
                        TelephoneNumber = string.Empty, Title = "Judge", Username = "Judge.Lumb@hmcts.net"
                    },
                    new ()
                    {
                        CaseRoleName = "Applicant", ContactEmail = "test.applicant@hmcts.net",
                        DisplayName = "Test Applicant", FirstName = "Test", HearingRoleName = "Litigant in person",
                        LastName = "Applicant", MiddleNames = string.Empty, TelephoneNumber = string.Empty,
                        Title = "Mr", Username = "Test.Applicant@hmcts.net"
                    },
                    new ()
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

            _v2HearingId = Guid.NewGuid();
            _vhExistingHearingV2 = new HearingDetailsResponseV2
            {
                Id = _v2HearingId,
                ScheduledDateTime = DateTime.UtcNow,
                ServiceId = "ServiceId",
                Participants = new List<ParticipantResponseV2>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        UserRoleName = "Individual",
                        ContactEmail = "old@domain.net",
                    }
                },
                Cases = new List<CaseResponseV2>
                {
                    new()
                    {
                        Name = "caseName",
                        Number = "caseNumber",
                        IsLeadCase = true,
                    }
                },
                HearingRoomName = "hearingRoomName",
                OtherInformation = "otherInformation",
                CreatedDate = DateTime.UtcNow,
                CreatedBy = "createdBy",
                UpdatedBy = "updatedBy",
                UpdatedDate = DateTime.UtcNow,
                ConfirmedBy = "confirmedBy",
                ConfirmedDate = DateTime.UtcNow,
                Status = BookingStatusV2.Booked,
                AudioRecordingRequired = true,
                CancelReason = null,
                Endpoints = new List<EndpointResponseV2>()
                {
                    new()
                    {
                        DefenceAdvocateId = Guid.NewGuid(),
                        DisplayName = "displayName",
                        Id = Guid.NewGuid(),
                        Pin = "pin",
                        Sip = "sip"
                    }
                }
            };

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_vhExistingHearingV1);
        }

        [Test]
        public async Task Should_return_ok_status_if_hearing_id_is_valid()
        {
            // Arrange
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_vhExistingHearingV1);

            // Act
            var result = await _controller.GetHearingById(_v1HearingId);
            
            // Assert
            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);

            var hearing = (HearingDetailsResponse) ((OkObjectResult) result).Value;
            hearing.Id.Should().Be(_vhExistingHearingV1.Id);
        }

        [Test]
        public async Task Should_return_ok_status_if_hearing_id_is_validV2()
        {
            // Arrange
            _mocker.Mock<IFeatureToggles>().Setup(x => x.UseV2Api())
                .Returns(true);
            _mocker.Mock<IBookingsApiClient>().Setup(x => 
                    x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>())).ReturnsAsync(_vhExistingHearingV2);

            // Act
            var result = await _controller.GetHearingById(_v2HearingId);
            
            // Assert
            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);

            var hearing = (HearingDetailsResponse) ((OkObjectResult) result).Value;
            hearing.Id.Should().Be(_vhExistingHearingV2.Id);
        }

        [Test]
        public async Task Should_return_ok_status_for_multi_day_hearing_V1()
        {
            // Arrange
            _mocker.Mock<IFeatureToggles>().Setup(x => x.UseV2Api())
                .Returns(false);
            var groupId = _vhExistingHearingV1.Id;
            _vhExistingHearingV1.GroupId = groupId;
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_vhExistingHearingV1);

            var dates = new List<DateTime>
            {
                _vhExistingHearingV1.ScheduledDateTime.AddDays(1), 
                _vhExistingHearingV1.ScheduledDateTime.AddDays(2),
                _vhExistingHearingV1.ScheduledDateTime.AddDays(3),
                _vhExistingHearingV1.ScheduledDateTime.AddDays(4)
            };
            var multiDayHearings = new List<BookingsApi.Contract.V1.Responses.HearingDetailsResponse>
            {
                _vhExistingHearingV1
            };
            multiDayHearings.AddRange(dates.Select(date => new BookingsApi.Contract.V1.Responses.HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                ScheduledDateTime = date,
                ScheduledDuration = _vhExistingHearingV1.ScheduledDuration,
                GroupId = groupId,
                Status = BookingStatus.Created
            }));
            // Set some to cancelled and failed so we can test they are filtered out
            multiDayHearings[2].Status = BookingStatus.Cancelled;
            multiDayHearings[3].Status = BookingStatus.Failed;
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingsByGroupIdAsync(groupId))
                .ReturnsAsync(multiDayHearings);
            
            // Act
            var result = await _controller.GetHearingById(_v1HearingId);
            
            // Assert
            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);
            
            var response = (HearingDetailsResponse) ((OkObjectResult) result).Value;
            var expectedActiveHearingsInGroup = multiDayHearings
                .Where(h => 
                    h.Status != BookingStatus.Cancelled && 
                    h.Status != BookingStatus.Failed)
                .ToList();
            var expectedHearingLastDay = expectedActiveHearingsInGroup[^1];
            response.MultiDayHearingLastDayScheduledDateTime.Should().Be(expectedHearingLastDay.ScheduledDateTime);
            response.HearingsInGroup.Should().BeEquivalentTo(multiDayHearings.Select(x => x.Map()));
        }
        
        [Test]
        public async Task Should_return_ok_status_for_multi_day_hearing_V2()
        {
            // Arrange
            _mocker.Mock<IFeatureToggles>().Setup(x => x.UseV2Api())
                .Returns(true);
            var groupId = _vhExistingHearingV2.Id;
            _vhExistingHearingV2.GroupId = groupId;
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(_vhExistingHearingV2);

            var dates = new List<DateTime>
            {
                _vhExistingHearingV2.ScheduledDateTime.AddDays(1), 
                _vhExistingHearingV2.ScheduledDateTime.AddDays(2),
                _vhExistingHearingV2.ScheduledDateTime.AddDays(3),
                _vhExistingHearingV2.ScheduledDateTime.AddDays(4),
            };
            var multiDayHearings = new List<HearingDetailsResponseV2>
            {
                _vhExistingHearingV2
            };
            multiDayHearings.AddRange(dates.Select(date => new HearingDetailsResponseV2
            {
                Id = Guid.NewGuid(),
                ScheduledDateTime = date,
                ScheduledDuration = _vhExistingHearingV2.ScheduledDuration,
                GroupId = groupId,
                Status = BookingStatusV2.Created
            }));
            // Set some to cancelled and failed so we can test they are filtered out
            multiDayHearings[2].Status = BookingStatusV2.Cancelled;
            multiDayHearings[3].Status = BookingStatusV2.Failed;
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingsByGroupIdV2Async(groupId))
                .ReturnsAsync(multiDayHearings);
            
            // Act
            var result = await _controller.GetHearingById(_v2HearingId);
            
            // Assert
            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);
            
            var response = (HearingDetailsResponse) ((OkObjectResult) result).Value;
            var expectedActiveHearingsInGroup = multiDayHearings
                .Where(h => 
                    h.Status != BookingStatusV2.Cancelled && 
                    h.Status != BookingStatusV2.Failed)
                .ToList();
            var expectedHearingLastDay = expectedActiveHearingsInGroup[^1];
            response.MultiDayHearingLastDayScheduledDateTime.Should().Be(expectedHearingLastDay.ScheduledDateTime);
            response.HearingsInGroup.Should().BeEquivalentTo(multiDayHearings.Select(x => x.Map()));
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
