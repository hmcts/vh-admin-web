﻿using AdminWebsite.Services;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Responses;
using AdminWebsite.Mappers;
using BookingsApi.Client;
using Autofac.Extras.Moq;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Responses;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class GetHearingTests
    {
        private AutoMock _mocker;
        private AdminWebsite.Controllers.HearingsController _controller;
        private Guid _V2HearingId;
        private Guid _v2HearingId;
        private HearingDetailsResponseV2 _vhExistingHearingV2;

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
            
            _controller = _mocker.Create<AdminWebsite.Controllers.HearingsController>();

            Initialise();
        }
        
        public void Initialise()
        {
            _V2HearingId = Guid.NewGuid();
            _vhExistingHearingV2 = new HearingDetailsResponseV2()
            {
                Cases = new List<CaseResponseV2>()
                {
                    new() {Name = "BBC vs ITV", Number = "TX/12345/2019", IsLeadCase = false}
                },
                ServiceId = "Generic",
                CreatedBy = "CaseAdministrator",
                CreatedDate = DateTime.UtcNow,
                HearingRoomName = "Room 6.41D",
                HearingVenueName = "Manchester Civil and Family Justice Centre",
                Id = _V2HearingId,
                OtherInformation = "Any other information about the hearing",
                Participants = new List<ParticipantResponseV2>()
                {
                    new ()
                    {
                        ContactEmail = "test.applicant@hmcts.net",
                        DisplayName = "Test Applicant", FirstName = "Test", HearingRoleName = "Litigant in person",
                        LastName = "Applicant", MiddleNames = string.Empty, TelephoneNumber = string.Empty,
                        Title = "Mr", Username = "Test.Applicant@hmcts.net"
                    },
                    new ()
                    {
                        ContactEmail = "test.respondent@hmcts.net",
                        DisplayName = "Test Respondent", FirstName = "Test", HearingRoleName = "Representative",
                        LastName = "Respondent", MiddleNames = string.Empty, TelephoneNumber = string.Empty,
                        Title = "Mr", Username = "Test.Respondent@hmcts.net"
                    },
                },
                ScheduledDateTime = DateTime.UtcNow.AddDays(10),
                ScheduledDuration = 60,
                Status = BookingStatusV2.Booked,
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

            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingDetailsByIdV2Async(It.IsAny<Guid>()))
                .ReturnsAsync(_vhExistingHearingV2);
        }
        

        [Test]
        public async Task Should_return_ok_status_if_hearing_id_is_valid()
        {
            // Arrange
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
        public async Task Should_return_ok_status_for_multi_day_hearing()
        {
            // Arrange
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
        public async Task Should_return_ok_status_for_cancelled_multi_day_hearing()
        {
            // Scenario - all days in the multi day hearing are cancelled
            
            // Arrange
            var groupId = _vhExistingHearingV2.Id;
            _vhExistingHearingV2.GroupId = groupId;
            _vhExistingHearingV2.Status = BookingStatusV2.Cancelled;
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
                Status = BookingStatusV2.Cancelled
            }));
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingsByGroupIdV2Async(groupId))
                .ReturnsAsync(multiDayHearings);
            
            // Act
            var result = await _controller.GetHearingById(_v2HearingId);
            
            // Assert
            var okRequestResult = (OkObjectResult) result;
            okRequestResult.StatusCode.Should().Be(200);
            
            var response = (HearingDetailsResponse) ((OkObjectResult) result).Value;
            response.MultiDayHearingLastDayScheduledDateTime.Should().BeNull();
            response.HearingsInGroup.Should().BeEquivalentTo(multiDayHearings.Select(x => x.Map()));
        }
    }
}
