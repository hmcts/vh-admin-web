using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Enums;
using BookingsApi.Contract.V1.Requests;
using BookingsApi.Contract.V1.Requests.Enums;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Requests;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using EndpointResponse = BookingsApi.Contract.V1.Responses.EndpointResponse;
using ParticipantResponse = BookingsApi.Contract.V1.Responses.ParticipantResponse;
using HearingDetailsResponse = BookingsApi.Contract.V1.Responses.HearingDetailsResponse;
using JudiciaryParticipantRequest = AdminWebsite.Contracts.Requests.JudiciaryParticipantRequest;
using HearingDetailsResponseV2 = BookingsApi.Contract.V2.Responses.HearingDetailsResponseV2;
using ParticipantResponseV2 = BookingsApi.Contract.V2.Responses.ParticipantResponseV2;
using EndpointResponseV2 = BookingsApi.Contract.V2.Responses.EndpointResponseV2;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class EditMultiDayHearingTests : HearingsControllerTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public async Task Should_update_multi_day_hearing_for_v1(bool updateFutureDays)
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var groupId = Guid.NewGuid();
            var existingHearingsInMultiDayGroup = CreateListOfV1HearingsInMultiDayGroup(groupId, hearingId);
            BookingsApiClient.Setup(x => x.GetHearingsByGroupIdAsync(groupId)).ReturnsAsync(existingHearingsInMultiDayGroup);
            var hearing = existingHearingsInMultiDayGroup.First(x => x.Id == hearingId);

            var request = CreateV1EditMultiDayHearingRequest(hearing);
            request.UpdateFutureDays = updateFutureDays;
            FeatureToggle.Setup(e => e.UseV2Api()).Returns(false);
            
            // Change the judge
            var judge = request.Participants.First(x => x.HearingRoleName == "Judge");
            judge.ContactEmail = "newJudge@email.com";
            judge.Id = null;
            // Add a participant
            var newParticipant = new EditParticipantRequest
            {
                FirstName = "Applicant",
                LastName = "Test",
                ContactEmail = "newApplicant@email.com",
                HearingRoleName = "Applicant"
            };
            request.Participants.Add(newParticipant);
            // Remove an endpoint
            var endpointToRemove = request.Endpoints.First(x => x.DisplayName == "Endpoint B");
            request.Endpoints.Remove(endpointToRemove);
            // Update an endpoint
            var endpointToUpdate = request.Endpoints.First(x => x.DisplayName == "Endpoint A");
            endpointToUpdate.DisplayName = "Endpoint A EDITED";

            var updatedHearing = MapUpdatedHearingV1(hearing, request);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(hearingId)).ReturnsAsync(updatedHearing);
            
            // Act
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var expectedResponse = updatedHearing.Map();
            result.Result.Should().BeOfType<OkObjectResult>();
            var objectResult = result.Result.As<OkObjectResult>();
            objectResult.Value.Should().BeEquivalentTo(expectedResponse);

            var expectedUpdatedHearings = new List<HearingDetailsResponse>();
            if (updateFutureDays)
            {
                expectedUpdatedHearings.AddRange(existingHearingsInMultiDayGroup);
            }
            else
            {
                expectedUpdatedHearings.Add(hearing);
            }

            var oldJudges = expectedUpdatedHearings
                .Where(h => h.Participants.Exists(p => p.HearingRoleName == "Judge"))
                .SelectMany(h => h.Participants)
                .Where(p => p.HearingRoleName == "Judge")
                .ToList();
            
            var removedEndpoints = expectedUpdatedHearings
                .SelectMany(h => h.Endpoints)
                .Where(e => e.DisplayName == endpointToRemove.DisplayName)
                .ToList();
            
            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupAsync(
                groupId,
                It.Is<UpdateHearingsInGroupRequest>(r =>
                    r.Hearings.TrueForAll(h =>
                        h.Participants.ExistingParticipants.Count == 1 &&
                        h.Participants.NewParticipants.Count == 2 &&
                        h.Participants.NewParticipants.Exists(p => p.ContactEmail == newParticipant.ContactEmail) &&
                        h.Participants.NewParticipants.Exists(p => p.ContactEmail == judge.ContactEmail) &&
                        h.Participants.RemovedParticipantIds.Count == 1 &&
                        h.Participants.RemovedParticipantIds.Any(id => oldJudges.Any(j => j.Id == id)) &&
                        h.Participants.LinkedParticipants.Count == 0 &&
                        h.Endpoints.RemovedEndpointIds.Any(id => removedEndpoints.Any(e => e.Id == id)
                    )))));
            
            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupAsync(
                groupId,
                It.Is<UpdateHearingsInGroupRequest>(r =>
                    r.Hearings.Exists(h =>
                        h.Endpoints.ExistingEndpoints.Count == 1))));
        }
        
        [TestCase(false)]
        [TestCase(true)]
        public async Task Should_update_multi_day_hearing_for_v2(bool updateFutureDays)
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var groupId = Guid.NewGuid();
            var existingHearingsInMultiDayGroup = CreateListOfV2HearingsInMultiDayGroup(groupId, hearingId);
            BookingsApiClient.Setup(x => x.GetHearingsByGroupIdAsync(groupId)).ReturnsAsync(existingHearingsInMultiDayGroup);
            var hearing = existingHearingsInMultiDayGroup.First(x => x.Id == hearingId);

            var request = CreateV2EditMultiDayHearingRequest(hearing);
            request.UpdateFutureDays = updateFutureDays;
            FeatureToggle.Setup(e => e.UseV2Api()).Returns(true);
            
            // Change the judge
            var judge = request.JudiciaryParticipants.First(x => x.Role == "Judge");
            var oldJudgePersonalCode = judge.PersonalCode;
            var newJudgePersonalCode = "NewJudgePersonalCode";
            judge.PersonalCode = newJudgePersonalCode;
            // Add a participant
            var newParticipant = new EditParticipantRequest
            {
                FirstName = "Applicant",
                LastName = "Test",
                ContactEmail = "newApplicant@email.com",
                HearingRoleName = "Applicant"
            };
            request.Participants.Add(newParticipant);
            // Remove an endpoint
            var endpointToRemove = request.Endpoints.First(x => x.DisplayName == "Endpoint B");
            request.Endpoints.Remove(endpointToRemove);
            // Update an endpoint
            var endpointToUpdate = request.Endpoints.First(x => x.DisplayName == "Endpoint A");
            endpointToUpdate.DisplayName = "Endpoint A EDITED";

            var updatedHearing = MapUpdatedHearingV2(hearing, request);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(updatedHearing);
            
            // Act
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var expectedResponse = updatedHearing.Map();
            result.Result.Should().BeOfType<OkObjectResult>();
            var objectResult = result.Result.As<OkObjectResult>();
            objectResult.Value.Should().BeEquivalentTo(expectedResponse);

            var expectedUpdatedHearings = new List<HearingDetailsResponse>();
            if (updateFutureDays)
            {
                expectedUpdatedHearings.AddRange(existingHearingsInMultiDayGroup);
            }
            else
            {
                expectedUpdatedHearings.Add(hearing);
            }
            
            var removedEndpoints = expectedUpdatedHearings
                .SelectMany(h => h.Endpoints)
                .Where(e => e.DisplayName == endpointToRemove.DisplayName)
                .ToList();
            
            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupV2Async(
                groupId,
                It.Is<UpdateHearingsInGroupRequestV2>(r =>
                    r.Hearings.TrueForAll(h =>
                        h.Participants.ExistingParticipants.Count == 1 &&
                        h.Participants.NewParticipants.Count == 1 &&
                        h.Participants.NewParticipants.Exists(p => p.ContactEmail == newParticipant.ContactEmail) &&
                        h.Participants.RemovedParticipantIds.Count == 0 &&
                        h.Participants.LinkedParticipants.Count == 0 &&
                        h.Endpoints.RemovedEndpointIds.Any(id => removedEndpoints.Any(e => e.Id == id) &&
                        h.JudiciaryParticipants.NewJudiciaryParticipants.Count == 1 &&
                        h.JudiciaryParticipants.NewJudiciaryParticipants.Exists(p => p.PersonalCode == newJudgePersonalCode) &&
                        h.JudiciaryParticipants.RemovedJudiciaryParticipantPersonalCodes.Exists(p => p == oldJudgePersonalCode)
                        )))));
            
            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupV2Async(
                groupId,
                It.Is<UpdateHearingsInGroupRequestV2>(r =>
                    r.Hearings.Exists(h =>
                        h.Endpoints.ExistingEndpoints.Count == 1))));
        }

        [Test]
        public async Task Should_forward_not_found_from_bookings_api_for_v1()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var request = new EditMultiDayHearingRequest();
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
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var notFoundResult = (NotFoundObjectResult)result.Result;
            notFoundResult.Value.Should().Be(errorMessage);
        }
        
        [Test]
        public async Task Should_forward_not_found_from_bookings_api_for_v2()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var request = new EditMultiDayHearingRequest();
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
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var notFoundResult = (NotFoundObjectResult)result.Result;
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

            var request = CreateV1EditMultiDayHearingRequest(hearing);
            hearing.GroupId = null;
            FeatureToggle.Setup(e => e.UseV2Api()).Returns(false);

            var updatedHearing = MapUpdatedHearingV1(hearing, request);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(hearingId)).ReturnsAsync(updatedHearing);
            
            var validationProblemDetails = new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                {"hearingId", new[] {"Hearing is not multi-day"}}
            });
            
            // Act
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var objectResult = (ObjectResult)result.Result;
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

            var request = CreateV2EditMultiDayHearingRequest(hearing);
            hearing.GroupId = null;
            FeatureToggle.Setup(e => e.UseV2Api()).Returns(true);

            var updatedHearing = MapUpdatedHearingV2(hearing, request);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(updatedHearing);
            
            var validationProblemDetails = new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                {"hearingId", new[] {"Hearing is not multi-day"}}
            });
            
            // Act
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var objectResult = (ObjectResult)result.Result;
            var validationProblems = (ValidationProblemDetails)objectResult.Value;
            
            var errors = validationProblems.Errors;
            errors.Should().BeEquivalentTo(validationProblemDetails.Errors);
        }
        
        [Test]
        public async Task Should_forward_bad_request_from_bookings_api()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var request = new EditMultiDayHearingRequest();
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
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            var objectResult = (ObjectResult)result.Result;
            var validationProblems = (ValidationProblemDetails)objectResult.Value;
            
            var errors = validationProblems.Errors;
            errors.Should().BeEquivalentTo(validationProblemDetails.Errors);
        }
        
        [Test]
        public async Task Should_forward_unhandled_error_from_bookings_api()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var request = new EditMultiDayHearingRequest();
            var errorMessage = "Unexpected error for unit test";
            var apiException = new BookingsApiException<string>("Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Server Error", null, errorMessage, null);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdAsync(hearingId))
                .ThrowsAsync(apiException);
            
            // Act & Assert
            Assert.ThrowsAsync<BookingsApiException<string>>(async () => await Controller.EditMultiDayHearing(hearingId, request)).Result
                .Should().Be(errorMessage);
        }
        
        private static HearingDetailsResponse MapUpdatedHearingV1(
            HearingDetailsResponse hearing, EditMultiDayHearingRequest request) =>
            new()
            {
                Id = hearing.Id,
                GroupId = hearing.GroupId,
                ScheduledDateTime = hearing.ScheduledDateTime,
                ScheduledDuration = hearing.ScheduledDuration,
                Status = hearing.Status,
                Participants = request.Participants.Select(x => new ParticipantResponse
                {
                    Id = x.Id ?? Guid.NewGuid(),
                    FirstName = x.FirstName,
                    LastName = x.LastName,
                    ContactEmail = x.ContactEmail,
                    DisplayName = x.DisplayName
                }).ToList(),
                Endpoints = request.Endpoints.Select(x => new EndpointResponse
                {
                    Id = x.Id ?? Guid.NewGuid(),
                    DisplayName = x.DisplayName
                }).ToList()
            };
        
        private static HearingDetailsResponseV2 MapUpdatedHearingV2(
            HearingDetailsResponse hearing, EditMultiDayHearingRequest request) =>
            new()
            {
                Id = hearing.Id,
                GroupId = hearing.GroupId,
                ScheduledDateTime = hearing.ScheduledDateTime,
                ScheduledDuration = hearing.ScheduledDuration,
                Status = BookingStatusV2.Created,
                Participants = request.Participants.Select(x => new ParticipantResponseV2
                {
                    Id = x.Id ?? Guid.NewGuid(),
                    FirstName = x.FirstName,
                    LastName = x.LastName,
                    ContactEmail = x.ContactEmail,
                    DisplayName = x.DisplayName
                }).ToList(),
                JudiciaryParticipants = request.JudiciaryParticipants.Select(x => new JudiciaryParticipantResponse
                {
                    DisplayName = x.DisplayName,
                    PersonalCode = x.PersonalCode,
                    HearingRoleCode = x.Role == "Judge" ? JudiciaryParticipantHearingRoleCode.Judge : JudiciaryParticipantHearingRoleCode.PanelMember
                }).ToList(),
                Endpoints = request.Endpoints.Select(x => new EndpointResponseV2
                {
                    Id = x.Id ?? Guid.NewGuid(),
                    DisplayName = x.DisplayName
                }).ToList()
            };
        
        private static EditMultiDayHearingRequest CreateV1EditMultiDayHearingRequest(HearingDetailsResponse hearing) =>
            new()
            {
                Participants = hearing.Participants.Select(x => new EditParticipantRequest
                {
                    Id = x.Id,
                    FirstName = x.FirstName,
                    LastName = x.LastName,
                    ContactEmail = x.ContactEmail,
                    DisplayName = x.DisplayName,
                    HearingRoleName = x.HearingRoleName
                }).ToList(),
                Endpoints = hearing.Endpoints.Select(x => new EditEndpointRequest
                {
                    Id = x.Id,
                    DisplayName = x.DisplayName
                }).ToList()
            };

        private static EditMultiDayHearingRequest CreateV2EditMultiDayHearingRequest(HearingDetailsResponse hearing) =>
            new()
            {
                Participants = hearing.Participants.Select(x => new EditParticipantRequest
                {
                    Id = x.Id,
                    FirstName = x.FirstName,
                    LastName = x.LastName,
                    ContactEmail = x.ContactEmail,
                    DisplayName = x.DisplayName,
                    HearingRoleCode = x.HearingRoleName
                }).ToList(),
                Endpoints = hearing.Endpoints.Select(x => new EditEndpointRequest
                {
                    Id = x.Id,
                    DisplayName = x.DisplayName
                }).ToList(),
                JudiciaryParticipants = hearing.JudiciaryParticipants.Select(x => new JudiciaryParticipantRequest
                {
                    PersonalCode = x.PersonalCode,
                    Role = x.HearingRoleCode.ToString(),
                    DisplayName = x.DisplayName
                }).ToList()
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
    }
}
