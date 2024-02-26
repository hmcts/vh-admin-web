using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Requests;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Responses;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class CancelMultiDayHearingTests : HearingsControllerTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public async Task should_cancel_multi_day_hearing_for_v1(bool updateFutureDays)
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var groupId = Guid.NewGuid();
            var existingHearingsInMultiDayGroup = CreateListOfV1HearingsInMultiDayGroup(groupId, hearingId);
            BookingsApiClient.Setup(x => x.GetHearingsByGroupIdAsync(groupId)).ReturnsAsync(existingHearingsInMultiDayGroup);
            var hearing = existingHearingsInMultiDayGroup.First(x => x.Id == hearingId);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(hearingId)).ReturnsAsync(hearing);
            
            var request = CreateRequest();
            request.UpdateFutureDays = updateFutureDays;

            UserIdentity.Setup(x => x.GetUserIdentityName()).Returns(request.UpdatedBy);
            FeatureToggle.Setup(e => e.UseV2Api()).Returns(false);

            // Act
            var response = await Controller.CancelMultiDayHearing(hearing.Id, request);

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
            
            BookingsApiClient.Verify(x => x.CancelHearingsInGroupAsync(
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
            BookingsApiClient.Setup(x => x.GetHearingsByGroupIdAsync(groupId)).ReturnsAsync(existingHearingsInMultiDayGroup);
            var hearing = existingHearingsInMultiDayGroup.First(x => x.Id == hearingId);
            var mappedHearing = MapHearingDetailsForV2(hearing);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(mappedHearing);
            
            var request = CreateRequest();
            request.UpdateFutureDays = updateFutureDays;

            UserIdentity.Setup(x => x.GetUserIdentityName()).Returns(request.UpdatedBy);
            FeatureToggle.Setup(e => e.UseV2Api()).Returns(true);

            // Act
            var response = await Controller.CancelMultiDayHearing(hearing.Id, request);

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
            
            BookingsApiClient.Verify(x => x.CancelHearingsInGroupAsync(
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
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(hearingId))
                .ThrowsAsync(apiException);
            FeatureToggle.Setup(e => e.UseV2Api()).Returns(false);
            
            // Act
            var result = await Controller.CancelMultiDayHearing(hearingId, request);
            
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
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId))
                .ThrowsAsync(apiException);
            FeatureToggle.Setup(e => e.UseV2Api()).Returns(true);
            
            // Act
            var result = await Controller.CancelMultiDayHearing(hearingId, request);
            
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
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(hearingId)).ReturnsAsync(hearing);

            var request = CreateRequest();
            
            FeatureToggle.Setup(e => e.UseV2Api()).Returns(false);
            
            var validationProblemDetails = new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                {"hearingId", new[] {"Hearing is not multi-day"}}
            });
            
            // Act
            var result = await Controller.CancelMultiDayHearing(hearingId, request);
            
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
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(mappedHearing);

            var request = CreateRequest();

            FeatureToggle.Setup(e => e.UseV2Api()).Returns(true);
            
            var validationProblemDetails = new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                {"hearingId", new[] {"Hearing is not multi-day"}}
            });
            
            // Act
            var result = await Controller.CancelMultiDayHearing(hearingId, request);
            
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
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(hearingId))
                .ThrowsAsync(apiException);
            
            // Act
            var result = await Controller.CancelMultiDayHearing(hearingId, request);
            
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
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(hearingId))
                .ThrowsAsync(apiException);
            
            // Act & Assert
            Assert.ThrowsAsync<BookingsApiException<string>>(async () => await Controller.CancelMultiDayHearing(hearingId, request)).Result
                .Should().Be(errorMessage);
        }
        
        private static CancelMultiDayHearingRequest CreateRequest() =>
            new()
            {
                UpdatedBy = "updatedBy@email.com",
                CancelReason = "cancellation reason"
            };
    
        private static HearingDetailsResponseV2 MapHearingDetailsForV2(HearingDetailsResponse hearing) =>
            new()
            {
                Id = hearing.Id,
                ScheduledDateTime = hearing.ScheduledDateTime,
                ScheduledDuration = hearing.ScheduledDuration,
                GroupId = hearing.GroupId
            };
    }
}
