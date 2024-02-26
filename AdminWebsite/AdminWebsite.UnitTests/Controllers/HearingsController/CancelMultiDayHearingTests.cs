using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Configuration;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Models;
using AdminWebsite.Security;
using AdminWebsite.Services;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Enums;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Requests.Enums;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Responses;
using EndpointResponse = BookingsApi.Contract.V1.Responses.EndpointResponse;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class CancelMultiDayHearingTests
    {
        private Mock<IBookingsApiClient> _bookingsApiClient;
        private Mock<IUserIdentity> _userIdentity;
        private Mock<IValidator<EditHearingRequest>> _editHearingRequestValidator;
        private Mock<IConferenceDetailsService> _conferencesServiceMock;
        private Mock<IFeatureToggles> _featureToggle;
        private Mock<IOptions<KinlyConfiguration>> _kinlyOptionsMock;
        private Mock<KinlyConfiguration> _kinlyConfigurationMock;
        private Mock<ILogger<HearingsService>> _participantGroupLogger;
        private IHearingsService _hearingsService;
        private AdminWebsite.Controllers.HearingsController _controller;
        
        [SetUp]
        public void Setup()
        {
            _bookingsApiClient = new Mock<IBookingsApiClient>();
            _userIdentity = new Mock<IUserIdentity>();
            _editHearingRequestValidator = new Mock<IValidator<EditHearingRequest>>();
            _conferencesServiceMock = new Mock<IConferenceDetailsService>();
            _featureToggle = new Mock<IFeatureToggles>();
            _conferencesServiceMock.Setup(cs => cs.GetConferenceDetailsByHearingId(It.IsAny<Guid>(), false))
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

            _kinlyOptionsMock = new Mock<IOptions<KinlyConfiguration>>();
            _kinlyConfigurationMock = new Mock<KinlyConfiguration>();
            _kinlyOptionsMock.Setup((op) => op.Value).Returns(_kinlyConfigurationMock.Object);

            _participantGroupLogger = new Mock<ILogger<HearingsService>>();
            _hearingsService = new HearingsService(_bookingsApiClient.Object, _participantGroupLogger.Object, _featureToggle.Object);

            _featureToggle.Setup(x => x.EJudEnabled()).Returns(true);

            _controller = new AdminWebsite.Controllers.HearingsController(_bookingsApiClient.Object,
                _userIdentity.Object,
                _editHearingRequestValidator.Object,
                new Mock<ILogger<AdminWebsite.Controllers.HearingsController>>().Object,
                _hearingsService,
                _conferencesServiceMock.Object,
                 _featureToggle.Object);
        }
        
        [TestCase(false)]
        [TestCase(true)]
        public async Task should_cancel_multi_day_hearing_for_v1(bool updateFutureDays)
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var groupId = Guid.NewGuid();
            var existingHearingsInMultiDayGroup = CreateListOfV1HearingsInMultiDayGroup(groupId, hearingId);
            _bookingsApiClient.Setup(x => x.GetHearingsByGroupIdAsync(groupId)).ReturnsAsync(existingHearingsInMultiDayGroup);
            var hearing = existingHearingsInMultiDayGroup.First(x => x.Id == hearingId);
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(hearingId)).ReturnsAsync(hearing);
            
            var request = CreateRequest();
            request.UpdateFutureDays = updateFutureDays;

            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns(request.UpdatedBy);
            _featureToggle.Setup(e => e.UseV2Api()).Returns(false);

            // Act
            var response = await _controller.CancelMultiDayHearing(hearing.Id, request);

            // Assert
            var result = (OkResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            
            var expectedUpdatedHearingIds = new List<Guid>();
            if (updateFutureDays)
            {
                expectedUpdatedHearingIds.AddRange(existingHearingsInMultiDayGroup.Select(h => h.Id));
            }
            else
            {
                expectedUpdatedHearingIds.Add(hearing.Id);
            }
            
            _bookingsApiClient.Verify(x => x.CancelHearingsInGroupAsync(
                groupId, 
                It.Is<CancelHearingsInGroupRequest>(r =>
                    r.UpdatedBy == request.UpdatedBy &&
                    r.CancelReason == request.CancelReason &&
                    r.HearingIds.SequenceEqual(expectedUpdatedHearingIds))),
                Times.Once);
        }
        
        [TestCase(false)]
        [TestCase(true)]
        public async Task should_cancel_multi_day_hearing_for_v2(bool updateFutureDays)
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var groupId = Guid.NewGuid();
            var existingHearingsInMultiDayGroup = CreateListOfV2HearingsInMultiDayGroup(groupId, hearingId);
            _bookingsApiClient.Setup(x => x.GetHearingsByGroupIdAsync(groupId)).ReturnsAsync(existingHearingsInMultiDayGroup);
            var hearing = existingHearingsInMultiDayGroup.First(x => x.Id == hearingId);
            var mappedHearing = MapHearingDetailsForV2(hearing);
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(mappedHearing);
            
            var request = CreateRequest();
            request.UpdateFutureDays = updateFutureDays;

            _userIdentity.Setup(x => x.GetUserIdentityName()).Returns(request.UpdatedBy);
            _featureToggle.Setup(e => e.UseV2Api()).Returns(true);

            // Act
            var response = await _controller.CancelMultiDayHearing(hearing.Id, request);

            // Assert
            var result = (OkResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            
            var expectedUpdatedHearingIds = new List<Guid>();
            if (updateFutureDays)
            {
                expectedUpdatedHearingIds.AddRange(existingHearingsInMultiDayGroup.Select(h => h.Id));
            }
            else
            {
                expectedUpdatedHearingIds.Add(hearing.Id);
            }
            
            _bookingsApiClient.Verify(x => x.CancelHearingsInGroupAsync(
                    groupId, 
                    It.Is<CancelHearingsInGroupRequest>(r =>
                        r.UpdatedBy == request.UpdatedBy &&
                        r.CancelReason == request.CancelReason &&
                        r.HearingIds.SequenceEqual(expectedUpdatedHearingIds))),
                Times.Once);
        }
        
        [Test]
        public async Task Should_forward_not_found_from_bookings_api_for_v1()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var request = new CancelMultiDayHearingRequest();
            var errorMessage = $"No hearing with id found [{hearingId}]";
            var apiException = new BookingsApiException<string>("NotFound", 
                (int)HttpStatusCode.NotFound,
                "NotFound",
                null,
                errorMessage,
                null);
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(hearingId))
                .ThrowsAsync(apiException);
            _featureToggle.Setup(e => e.UseV2Api()).Returns(false);
            
            // Act
            var result = await _controller.CancelMultiDayHearing(hearingId, request);
            
            // Assert
            var notFoundResult = (NotFoundObjectResult)result;
            notFoundResult.Value.Should().Be(errorMessage);
        }
        
        [Test]
        public async Task Should_forward_not_found_from_bookings_api_for_v2()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var request = new CancelMultiDayHearingRequest();
            var errorMessage = $"No hearing with id found [{hearingId}]";
            var apiException = new BookingsApiException<string>("NotFound", 
                (int)HttpStatusCode.NotFound,
                "NotFound",
                null,
                errorMessage,
                null);
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId))
                .ThrowsAsync(apiException);
            _featureToggle.Setup(e => e.UseV2Api()).Returns(true);
            
            // Act
            var result = await _controller.CancelMultiDayHearing(hearingId, request);
            
            // Assert
            var notFoundResult = (NotFoundObjectResult)result;
            notFoundResult.Value.Should().Be(errorMessage);
        }

        [Test]
        public async Task Should_return_bad_request_when_hearing_is_not_multi_day_for_v1()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var groupId = Guid.NewGuid();
            var existingHearingsInMultiDayGroup = CreateListOfV1HearingsInMultiDayGroup(groupId, hearingId);
            var hearing = existingHearingsInMultiDayGroup.First(x => x.Id == hearingId);
            hearing.GroupId = null;
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(hearingId)).ReturnsAsync(hearing);

            var request = CreateRequest();
            
            _featureToggle.Setup(e => e.UseV2Api()).Returns(false);
            
            var validationProblemDetails = new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                {"hearingId", new[] {"Hearing is not multi-day"}}
            });
            
            // Act
            var result = await _controller.CancelMultiDayHearing(hearingId, request);
            
            // Assert
            var objectResult = (ObjectResult)result;
            var validationProblems = (ValidationProblemDetails)objectResult.Value;
            
            var errors = validationProblems.Errors;
            errors.Should().BeEquivalentTo(validationProblemDetails.Errors);
        }
        
        [Test]
        public async Task Should_return_bad_request_when_hearing_is_not_multi_day_for_v2()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var groupId = Guid.NewGuid();
            var existingHearingsInMultiDayGroup = CreateListOfV2HearingsInMultiDayGroup(groupId, hearingId);
            var hearing = existingHearingsInMultiDayGroup.First(x => x.Id == hearingId);
            hearing.GroupId = null;
            var mappedHearing = MapHearingDetailsForV2(hearing);
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(mappedHearing);

            var request = CreateRequest();

            _featureToggle.Setup(e => e.UseV2Api()).Returns(true);
            
            var validationProblemDetails = new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                {"hearingId", new[] {"Hearing is not multi-day"}}
            });
            
            // Act
            var result = await _controller.CancelMultiDayHearing(hearingId, request);
            
            // Assert
            var objectResult = (ObjectResult)result;
            var validationProblems = (ValidationProblemDetails)objectResult.Value;
            
            var errors = validationProblems.Errors;
            errors.Should().BeEquivalentTo(validationProblemDetails.Errors);
        }
        
        [Test]
        public async Task Should_forward_bad_request_from_bookings_api()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var request = new CancelMultiDayHearingRequest();
            var validationProblemDetails = new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                {"id", new[] {"Please provide a valid id"}}
            });
            var apiException = new BookingsApiException<ValidationProblemDetails>("BadRequest", 
                (int)HttpStatusCode.BadRequest,
                "Please provide a valid id",
                null,
                validationProblemDetails,
                null);
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(hearingId))
                .ThrowsAsync(apiException);
            
            // Act
            var result = await _controller.CancelMultiDayHearing(hearingId, request);
            
            var objectResult = (ObjectResult)result;
            var validationProblems = (ValidationProblemDetails)objectResult.Value;
            
            var errors = validationProblems.Errors;
            errors.Should().BeEquivalentTo(validationProblemDetails.Errors);
        }
        
        [Test]
        public void Should_forward_unhandled_error_from_bookings_api()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var request = new CancelMultiDayHearingRequest();
            var errorMessage = "Unexpected error for unit test";
            var apiException = new BookingsApiException<string>("Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Server Error", null, errorMessage, null);
            _bookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(hearingId))
                .ThrowsAsync(apiException);
            
            // Act & Assert
            Assert.ThrowsAsync<BookingsApiException<string>>(async () => await _controller.CancelMultiDayHearing(hearingId, request)).Result
                .Should().Be(errorMessage);
        }
        
        private static CancelMultiDayHearingRequest CreateRequest() =>
            new()
            {
                UpdatedBy = "updatedBy@email.com",
                CancelReason = "cancellation reason"
            };
        
        private static List<HearingDetailsResponse> CreateListOfV1HearingsInMultiDayGroup(
            Guid groupId, Guid initialHearingId)
        {
            var hearingDates = new List<DateTime>
            {
                DateTime.Today.AddDays(1).AddHours(10),
                DateTime.UtcNow.AddDays(2).AddHours(10),
                DateTime.UtcNow.AddDays(3).AddHours(10)
            };
            
            var hearingsInMultiDay = new List<HearingDetailsResponse>();
            var i = 0;
            foreach (var date in hearingDates)
            {
                var hearing = Builder<HearingDetailsResponse>.CreateNew().Build();

                hearing.Participants = new List<ParticipantResponse>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        FirstName = "Judge",
                        LastName = "Test",
                        ContactEmail = "judge@email.com",
                        Username = "judge@hearings.reform.hmcts.net",
                        HearingRoleName = "Judge",
                        UserRoleName = "Judge"
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        FirstName = "Applicant",
                        LastName = "Test",
                        ContactEmail = "applicant@email.com",
                        Username = "applicant@hearings.reform.hmcts.net",
                        HearingRoleName = "Applicant",
                        UserRoleName = "Individual"
                    }
                };
        
                hearing.Endpoints = new List<EndpointResponse>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        DisplayName = "Endpoint A"
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        DisplayName = "Endpoint B"
                    }
                };
                
                hearing.GroupId = groupId;
                hearing.ScheduledDateTime = date;
                hearing.ScheduledDuration = 45;
                hearing.Status = BookingStatus.Created;
                hearing.Id = i == 0 ? initialHearingId : Guid.NewGuid();
                
                hearingsInMultiDay.Add(hearing);
                
                i++;
            }

            return hearingsInMultiDay;
        }
        
        private static List<HearingDetailsResponse> CreateListOfV2HearingsInMultiDayGroup(
            Guid groupId, Guid initialHearingId)
        {
            var hearingDates = new List<DateTime>
            {
                DateTime.Today.AddDays(1).AddHours(10),
                DateTime.UtcNow.AddDays(2).AddHours(10),
                DateTime.UtcNow.AddDays(3).AddHours(10)
            };
            
            var hearingsInMultiDay = new List<HearingDetailsResponse>();
            var i = 0;
            foreach (var date in hearingDates)
            {
                var hearing = Builder<HearingDetailsResponse>.CreateNew().Build();

                hearing.Participants = new List<ParticipantResponse>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        FirstName = "Applicant",
                        LastName = "Test",
                        ContactEmail = "applicant@email.com",
                        Username = "applicant@hearings.reform.hmcts.net",
                        HearingRoleName = "Applicant",
                        UserRoleName = "Individual"
                    }
                };
                
                hearing.JudiciaryParticipants = new List<JudiciaryParticipantResponse>
                {
                    new()
                    {
                        PersonalCode = "PersonalCode",
                        DisplayName = "Judge Test",
                        FirstName = "Judge",
                        LastName = "Test",
                        Email = "judge@email.com",
                        HearingRoleCode = JudiciaryParticipantHearingRoleCode.Judge
                    }
                };
                
                hearing.Endpoints = new List<EndpointResponse>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        DisplayName = "Endpoint A"
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        DisplayName = "Endpoint B"
                    }
                };
                
                hearing.GroupId = groupId;
                hearing.ScheduledDateTime = date;
                hearing.ScheduledDuration = 45;
                hearing.Status = BookingStatus.Created;
                hearing.Id = i == 0 ? initialHearingId : Guid.NewGuid();
                
                hearingsInMultiDay.Add(hearing);
                
                i++;
            }

            return hearingsInMultiDay;
        }

        private HearingDetailsResponseV2 MapHearingDetailsForV2(HearingDetailsResponse hearing) =>
            new()
            {
                Id = hearing.Id,
                ScheduledDateTime = hearing.ScheduledDateTime,
                ScheduledDuration = hearing.ScheduledDuration,
                GroupId = hearing.GroupId
            };
    }
}
