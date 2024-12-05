using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Models;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Responses;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class CancelMultiDayHearingTests : HearingsControllerTests
    {
        private const string UpdatedBy = "updatedBy@email.com";

        [SetUp]
        protected override void Setup()
        {
            base.Setup();
            UserIdentity.Setup(x => x.GetUserIdentityName()).Returns(UpdatedBy);
        }
        
        
        [TestCase(false)]
        [TestCase(true)]
        public async Task should_cancel_multi_day_hearing(bool updateFutureDays)
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var groupId = Guid.NewGuid();
            var hearingDates = new List<DateTime>
            {
                DateTime.Today.AddDays(1).AddHours(10),
                DateTime.UtcNow.AddDays(2).AddHours(10),
                DateTime.UtcNow.AddDays(3).AddHours(10),
                DateTime.UtcNow.AddDays(4).AddHours(10),
                DateTime.UtcNow.AddDays(5).AddHours(10),
            };
            var existingHearingsInMultiDayGroup = CreateListOfV2HearingsInMultiDayGroup(groupId, hearingId, scheduledDates: hearingDates);
            existingHearingsInMultiDayGroup[3].Status = BookingStatusV2.Cancelled;
            existingHearingsInMultiDayGroup[4].Status = BookingStatusV2.Failed;
            BookingsApiClient.Setup(x => x.GetHearingsByGroupIdV2Async(groupId)).ReturnsAsync(existingHearingsInMultiDayGroup);
            var hearing = existingHearingsInMultiDayGroup.First(x => x.Id == hearingId);
            var mappedHearing = MapHearingDetailsForV2(hearing);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(mappedHearing);
            
            var request = CreateRequest();
            request.UpdateFutureDays = updateFutureDays;
            
            // Act
            var response = await Controller.CancelMultiDayHearing(hearing.Id, request);

            // Assert
            var result = (OkObjectResult)response;
            result.StatusCode.Should().Be(StatusCodes.Status200OK);
            result.Value.Should().NotBeNull().And.BeAssignableTo<UpdateBookingStatusResponse>().Subject.Success.Should().BeTrue();
            
            var expectedUpdatedHearings = new List<HearingDetailsResponseV2>();
            if (updateFutureDays)
            {
                expectedUpdatedHearings.AddRange(existingHearingsInMultiDayGroup);
            }
            else
            {
                expectedUpdatedHearings.Add(hearing);
            }
            
            expectedUpdatedHearings = expectedUpdatedHearings
                .Where(h => 
                    h.Status != BookingStatusV2.Cancelled && 
                    h.Status != BookingStatusV2.Failed)
                .ToList();
            
            BookingsApiClient.Verify(x => x.CancelHearingsInGroupAsync(
                    groupId, 
                    It.Is<CancelHearingsInGroupRequest>(r =>
                        r.UpdatedBy == UpdatedBy &&
                        r.CancelReason == request.CancelReason &&
                        r.HearingIds.SequenceEqual(expectedUpdatedHearings.Select(h => h.Id)))),
                Times.Once);
        }
  
        [Test]
        public async Task Should_forward_not_found_from_bookings_api()
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
            
            // Act
            var result = await Controller.CancelMultiDayHearing(hearingId, request);
            
            // Assert
            var notFoundResult = (NotFoundObjectResult)result;
            notFoundResult.Value.Should().Be(errorMessage);
        }

        [Test]
        public async Task Should_return_bad_request_when_hearing_is_not_multi_day()
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

            var validationProblemDetails = new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                {"hearingId", ["Hearing is not multi-day"] }
            });
            
            // Act
            var result = await Controller.CancelMultiDayHearing(hearingId, request);
            
            // Assert
            var objectResult = (ObjectResult)result;
            var validationProblems = (ValidationProblemDetails)objectResult.Value;
            
            var errors = validationProblems.Errors;
            errors.Should().BeEquivalentTo(validationProblemDetails.Errors);
        }
        
        private static CancelMultiDayHearingRequest CreateRequest() =>
            new()
            {
                CancelReason = "cancellation reason"
            };
    
        private static HearingDetailsResponseV2 MapHearingDetailsForV2(HearingDetailsResponseV2 hearing) =>
            new()
            {
                Id = hearing.Id,
                ScheduledDateTime = hearing.ScheduledDateTime,
                ScheduledDuration = hearing.ScheduledDuration,
                GroupId = hearing.GroupId
            };
    }
}
