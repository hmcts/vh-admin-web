using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AdminWebsite.Contracts.Requests;
using AdminWebsite.Mappers;
using AdminWebsite.Models;
using BookingsApi.Client;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;
using Microsoft.AspNetCore.Mvc;
using JudiciaryParticipantRequest = AdminWebsite.Contracts.Requests.JudiciaryParticipantRequest;
using HearingDetailsResponseV2 = BookingsApi.Contract.V2.Responses.HearingDetailsResponseV2;
using ParticipantResponseV2 = BookingsApi.Contract.V2.Responses.ParticipantResponseV2;
using EndpointResponseV2 = BookingsApi.Contract.V2.Responses.EndpointResponseV2;
using LinkedParticipantType = AdminWebsite.Contracts.Enums.LinkedParticipantType;

namespace AdminWebsite.UnitTests.Controllers.HearingsController
{
    public class EditMultiDayHearingTests : HearingsControllerTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public async Task Should_update_multi_day_hearing(bool updateFutureDays)
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
            var existingHearingsInMultiDayGroup = CreateListOfV2HearingsInMultiDayGroupAsV2(groupId, hearingId, scheduledDates: hearingDates);
            existingHearingsInMultiDayGroup[3].Status = BookingStatusV2.Cancelled;
            existingHearingsInMultiDayGroup[4].Status = BookingStatusV2.Failed;
            BookingsApiClient.Setup(x => x.GetHearingsByGroupIdV2Async(groupId)).ReturnsAsync(existingHearingsInMultiDayGroup);
            var hearing = existingHearingsInMultiDayGroup.First(x => x.Id == hearingId);

            var request = CreateV2EditMultiDayHearingRequest(hearing);
            request.UpdateFutureDays = updateFutureDays;
            request.HearingsInGroup = new List<UpdateHearingInGroupRequest>();
            foreach (var hearingInGroup in existingHearingsInMultiDayGroup)
            {
                request.HearingsInGroup.Add(new UpdateHearingInGroupRequest
                {
                    HearingId = hearingInGroup.Id,
                    ScheduledDateTime = hearingInGroup.ScheduledDateTime.AddDays(1)
                });
            }
            
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
            // Add linked participants
            var newInterpretee = new EditParticipantRequest
            {
                FirstName = "New Interpretee",
                LastName = "Test",
                ContactEmail = "newInterpretee@email.com",
                HearingRoleName = "Applicant",
                LinkedParticipants = new List<LinkedParticipant>
                {
                    new()
                    {
                        Type = LinkedParticipantType.Interpreter,
                        ParticipantContactEmail = "newInterpretee@email.com",
                        LinkedParticipantContactEmail = "newInterpreter@email.com"
                    }
                }
            };
            request.Participants.Add(newInterpretee);
            var newInterpreter = new EditParticipantRequest
            {
                FirstName = "New Interpreter",
                LastName = "Test",
                ContactEmail = "newInterpreter@email.com",
                HearingRoleName = "Interpreter",
                LinkedParticipants = new List<LinkedParticipant>
                {
                    new()
                    {
                        Type = LinkedParticipantType.Interpreter,
                        ParticipantContactEmail = "newInterpreter@email.com",
                        LinkedParticipantContactEmail = "newInterpretee@email.com"
                    }
                }
            };
            request.Participants.Add(newInterpreter);
            // Remove an endpoint
            var endpointToRemove = request.Endpoints.First(x => x.DisplayName == "Endpoint B");
            request.Endpoints.Remove(endpointToRemove);
            // Update an endpoint
            var endpointToUpdate = request.Endpoints.First(x => x.DisplayName == "Endpoint A");
            endpointToUpdate.DisplayName = "Endpoint A EDITED";
            endpointToUpdate.LinkedParticipantEmails = [newParticipant.ContactEmail];
            // Add an endpoint
            var newEndpoint = new EditEndpointRequest { DisplayName = "Endpoint D" };
            request.Endpoints.Add(newEndpoint);

            var updatedHearing = MapUpdatedHearingV2(hearing, request);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(updatedHearing);
            
            const string updatedBy = "updatedBy@email.com";
            UserIdentity.Setup(x => x.GetUserIdentityName()).Returns(updatedBy);
            
            // Act
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var expectedResponse = updatedHearing.Map();
            result.Result.Should().BeOfType<OkObjectResult>();
            var objectResult = result.Result.As<OkObjectResult>();
            objectResult.Value.Should().BeEquivalentTo(expectedResponse);

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
            
            var removedEndpoints = expectedUpdatedHearings
                .SelectMany(h => h.Endpoints)
                .Where(e => e.DisplayName == endpointToRemove.DisplayName)
                .ToList();
            
            // Hearing details common to all hearings in the group
            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupV2Async(
                groupId,
                It.Is<UpdateHearingsInGroupRequestV2>(r =>
                    r.Hearings.TrueForAll(h =>
                        h.ScheduledDuration == request.ScheduledDuration &&
                        h.HearingVenueCode == request.HearingVenueCode &&
                        h.HearingRoomName == request.HearingRoomName &&
                        h.OtherInformation == request.OtherInformation &&
                        h.CaseNumber == request.CaseNumber &&
                        !h.AudioRecordingRequired && // must be false (original value) as we added an interpreter
                        h.Participants.ExistingParticipants.Count == 3 &&
                        h.Participants.NewParticipants.Count == 3 &&
                        h.Participants.NewParticipants.Exists(p => p.ContactEmail == newParticipant.ContactEmail) &&
                        h.Participants.RemovedParticipantIds.Count == 0 &&
                        h.Participants.LinkedParticipants.Count == 3 &&
                        h.Endpoints.ExistingEndpoints.Count == 1 &&
                        h.Endpoints.ExistingEndpoints[0].DisplayName == endpointToUpdate.DisplayName &&
                        h.Endpoints.ExistingEndpoints[0].LinkedParticipantEmails.Contains(endpointToUpdate.LinkedParticipantEmails[0]) &&
                        h.Endpoints.RemovedEndpointIds.Any(id => removedEndpoints.Any(e => e.Id == id) &&
                        h.Endpoints.NewEndpoints.Count == 1 &&
                        h.Endpoints.NewEndpoints.Exists(e => e.DisplayName == newEndpoint.DisplayName) &&
                        h.JudiciaryParticipants.NewJudiciaryParticipants.Count == 1 &&
                        h.JudiciaryParticipants.NewJudiciaryParticipants.Exists(p => p.PersonalCode == newJudgePersonalCode) &&
                        h.JudiciaryParticipants.RemovedJudiciaryParticipantPersonalCodes.Exists(p => p == oldJudgePersonalCode)
                        )))));
            
            // Hearing details specific to each hearing in the group
            foreach (var hearingInGroup in request.HearingsInGroup)
            {
                if (!expectedUpdatedHearings.Exists(h => h.Id == hearingInGroup.HearingId))
                {
                    continue;
                }
                
                BookingsApiClient.Verify(x => x.UpdateHearingsInGroupV2Async(
                    groupId,
                    It.Is<UpdateHearingsInGroupRequestV2>(r =>
                        r.Hearings.Exists(h => 
                            h.HearingId == hearingInGroup.HearingId &&
                            h.ScheduledDateTime == hearingInGroup.ScheduledDateTime))));
            }
        }

        [Test]
        public async Task should_update_multi_day_hearing_when_judiciary_participants_are_unchanged()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var groupId = Guid.NewGuid();
            var existingHearingsInMultiDayGroup = CreateListOfV2HearingsInMultiDayGroup(groupId, hearingId);
            BookingsApiClient.Setup(x => x.GetHearingsByGroupIdV2Async(groupId)).ReturnsAsync(existingHearingsInMultiDayGroup);
            var hearing = existingHearingsInMultiDayGroup.First(x => x.Id == hearingId);

            var request = CreateV2EditMultiDayHearingRequest(hearing);
            request.HearingsInGroup = new List<UpdateHearingInGroupRequest>();
            foreach (var hearingInGroup in existingHearingsInMultiDayGroup)
            {
                request.HearingsInGroup.Add(new UpdateHearingInGroupRequest
                {
                    HearingId = hearingInGroup.Id,
                    ScheduledDateTime = hearingInGroup.ScheduledDateTime
                });
            }
            
            var updatedHearing = MapUpdatedHearingV2(hearing, request);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(updatedHearing);
            
            const string updatedBy = "updatedBy@email.com";
            UserIdentity.Setup(x => x.GetUserIdentityName()).Returns(updatedBy);
            
            // Act
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var expectedResponse = updatedHearing.Map();
            result.Result.Should().BeOfType<OkObjectResult>();
            var objectResult = result.Result.As<OkObjectResult>();
            objectResult.Value.Should().BeEquivalentTo(expectedResponse);
            
            // Assert
            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupV2Async(
                groupId,
                It.Is<UpdateHearingsInGroupRequestV2>(r =>
                    r.Hearings.TrueForAll(h =>
                        h.JudiciaryParticipants.ExistingJudiciaryParticipants.Count == request.JudiciaryParticipants.Count
                        ))));
        }

        [Test]
        public async Task Should_not_overwrite_data_for_future_days_when_only_specific_details_are_changed()
        {
            // Scenario - we have a 2 day hearing
            // Day 2 has been individually edited, and so has different details, participants and endpoints to Day 1
            // User then makes a small edit to Day 1 (eg they change the Other Information) and specifies to update the future days
            // Only the Other Information should be updated on Day 2, all other data should remain as it was previously
            
            // Arrange
            var hearingId = Guid.NewGuid();
            var groupId = Guid.NewGuid();
            var scheduledDates = new List<DateTime>
            {
                DateTime.Today.AddDays(1).AddHours(10),
                DateTime.Today.AddDays(2).AddHours(10)
            };
            var existingHearingsInMultiDayGroup = CreateListOfV2HearingsInMultiDayGroupAsV2(groupId, hearingId, scheduledDates: scheduledDates);
            
            // Make the day 2 details different to day 1, so we can check that they are not overwritten
            var day1Hearing = existingHearingsInMultiDayGroup[0];
            day1Hearing.Participants.Add(new ParticipantResponseV2
            {
                Id = Guid.NewGuid(),
                FirstName = "Applicant",
                LastName = "TestDay1",
                ContactEmail = "applicant-day1@email.com",
                Username = "applicant-day1@hearings.reform.hmcts.net",
                HearingRoleName = "Applicant",
                UserRoleName = "Individual",
                LinkedParticipants = new List<LinkedParticipantResponseV2>()
            });
            day1Hearing.Endpoints.Add(new EndpointResponseV2
            {
                Id = Guid.NewGuid(),
                DisplayName = "Endpoint X"
            });
            day1Hearing.JudicialOfficeHolders.Add(new JudiciaryParticipantResponse
            {
                PersonalCode = Guid.NewGuid().ToString(),
                DisplayName = "PanelMemberDay1",
                HearingRoleCode = JudiciaryParticipantHearingRoleCode.PanelMember
            });
            var day2Hearing = existingHearingsInMultiDayGroup[1];
            const string day2Suffix = " Day 2";
            day2Hearing.ScheduledDuration = 90;
            day2Hearing.HearingVenueCode += day2Suffix;
            day2Hearing.HearingRoomName += day2Suffix;
            day2Hearing.OtherInformation += day2Suffix;
            day2Hearing.Cases[0].Number += day2Suffix;
            day2Hearing.Cases[0].Name += day2Suffix;
            day2Hearing.AudioRecordingRequired = !day1Hearing.AudioRecordingRequired;
            day2Hearing.Participants.Add(new ParticipantResponseV2
            {
                Id = Guid.NewGuid(),
                FirstName = "Applicant",
                LastName = "TestDay2",
                ContactEmail = "applicant-day2@email.com",
                Username = "applicant-day2@hearings.reform.hmcts.net",
                HearingRoleName = "Applicant",
                UserRoleName = "Individual",
                LinkedParticipants = new List<LinkedParticipantResponseV2>()
            });
            day2Hearing.Endpoints.Add(new EndpointResponseV2
            {
                Id = Guid.NewGuid(),
                DisplayName = "Endpoint C"
            });
            day2Hearing.JudicialOfficeHolders.Add(new JudiciaryParticipantResponse
            {
                PersonalCode = Guid.NewGuid().ToString(),
                DisplayName = "PanelMemberDay2",
                HearingRoleCode = JudiciaryParticipantHearingRoleCode.PanelMember
            });
            
            BookingsApiClient.Setup(x => x.GetHearingsByGroupIdV2Async(groupId)).ReturnsAsync(existingHearingsInMultiDayGroup);
            
            var request = CreateV2EditMultiDayHearingRequest(day1Hearing);
            request.HearingsInGroup = new List<UpdateHearingInGroupRequest>();
            foreach (var hearingInGroup in existingHearingsInMultiDayGroup)
            {
                request.HearingsInGroup.Add(new UpdateHearingInGroupRequest
                {
                    HearingId = hearingInGroup.Id,
                    ScheduledDateTime = hearingInGroup.ScheduledDateTime
                });
            }
            request.ScheduledDuration = day1Hearing.ScheduledDuration;
            request.HearingVenueCode = day1Hearing.HearingVenueCode;
            request.HearingRoomName = day1Hearing.HearingRoomName;
            request.OtherInformation = day1Hearing.OtherInformation + " EDITED"; // Change the other information
            request.CaseNumber = day1Hearing.Cases[0].Number;
            request.AudioRecordingRequired = day1Hearing.AudioRecordingRequired;
            request.UpdateFutureDays = true;
            
            var updatedHearing = MapUpdatedHearingV2(day1Hearing, request);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(updatedHearing);
            
            const string updatedBy = "updatedBy@email.com";
            UserIdentity.Setup(x => x.GetUserIdentityName()).Returns(updatedBy);
            
            // Act
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var expectedResponse = updatedHearing.Map();
            result.Result.Should().BeOfType<OkObjectResult>();
            var objectResult = result.Result.As<OkObjectResult>();
            objectResult.Value.Should().BeEquivalentTo(expectedResponse);

            // Day 1
            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupV2Async(
                groupId,
                It.Is<UpdateHearingsInGroupRequestV2>(r =>
                    r.Hearings.Exists(h => 
                        h.HearingId == day1Hearing.Id && 
                        h.ScheduledDuration == day1Hearing.ScheduledDuration && 
                        h.HearingVenueCode == day1Hearing.HearingVenueCode && 
                        h.HearingRoomName == day1Hearing.HearingRoomName && 
                        h.OtherInformation == request.OtherInformation && 
                        h.CaseNumber == day1Hearing.Cases[0].Number && 
                        h.AudioRecordingRequired == day1Hearing.AudioRecordingRequired && 
                        h.Participants.ExistingParticipants.Count == day1Hearing.Participants.Count && 
                        h.Participants.NewParticipants.Count == 0 && 
                        h.Participants.RemovedParticipantIds.Count == 0 && 
                        h.Participants.LinkedParticipants.Count == 1 && 
                        h.Endpoints.ExistingEndpoints.Count == day1Hearing.Endpoints.Count && 
                        h.Endpoints.NewEndpoints.Count == 0 && 
                        h.Endpoints.RemovedEndpointIds.Count == 0 &&
                        h.JudiciaryParticipants.NewJudiciaryParticipants.Count == 0 &&
                        h.JudiciaryParticipants.ExistingJudiciaryParticipants.Count == day1Hearing.JudicialOfficeHolders.Count &&
                        h.JudiciaryParticipants.RemovedJudiciaryParticipantPersonalCodes.Count == 0
                        ))));
            
            // Day 2
            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupV2Async(
                groupId,
                It.Is<UpdateHearingsInGroupRequestV2>(r =>
                    r.Hearings.Exists(h => 
                        h.HearingId == day2Hearing.Id && 
                        h.ScheduledDuration == day2Hearing.ScheduledDuration && 
                        h.HearingVenueCode == day2Hearing.HearingVenueCode && 
                        h.HearingRoomName == day2Hearing.HearingRoomName && 
                        h.OtherInformation == request.OtherInformation && 
                        h.CaseNumber == day2Hearing.Cases[0].Number && 
                        h.AudioRecordingRequired == day2Hearing.AudioRecordingRequired && 
                        h.Participants.ExistingParticipants.Count == day2Hearing.Participants.Count && 
                        h.Participants.NewParticipants.Count == 0 && 
                        h.Participants.RemovedParticipantIds.Count == 0 && 
                        h.Participants.LinkedParticipants.Count == 1 && 
                        h.Endpoints.ExistingEndpoints.Count == day2Hearing.Endpoints.Count && 
                        h.Endpoints.NewEndpoints.Count == 0 && 
                        h.Endpoints.RemovedEndpointIds.Count == 0 &&
                        h.JudiciaryParticipants.NewJudiciaryParticipants.Count == 0 &&
                        h.JudiciaryParticipants.ExistingJudiciaryParticipants.Count == day2Hearing.JudicialOfficeHolders.Count &&
                        h.JudiciaryParticipants.RemovedJudiciaryParticipantPersonalCodes.Count == 0
                        ))));
        }

        [Test]
        public async Task Should_update_multi_day_hearing_when_updated_participants_and_endpoints_do_not_exist_on_future_days()
        {
            // Scenario - we have a 2 day hearing
            // Day 1 has been individually edited, and has additional participants and endpoints not on Day 2
            // User then edits these participants and endpoints and specifies to update the future days
            // These additional participants and endpoints should be skipped on the Day 2 update
            
            // Arrange
            var hearingId = Guid.NewGuid();
            var groupId = Guid.NewGuid();
            var scheduledDates = new List<DateTime>
            {
                DateTime.Today.AddDays(1).AddHours(10),
                DateTime.Today.AddDays(2).AddHours(10)
            };
            var existingHearingsInMultiDayGroup = CreateListOfV2HearingsInMultiDayGroupAsV2(groupId, hearingId, scheduledDates: scheduledDates);
            
            // Add the additional participants and endpoints to day 1
            var day1Hearing = existingHearingsInMultiDayGroup[0];
            var day2Hearing = existingHearingsInMultiDayGroup[0];
            day1Hearing.Participants.Add(new ParticipantResponseV2
            {
                Id = Guid.NewGuid(),
                FirstName = "Applicant",
                LastName = "Test 2",
                ContactEmail = "applicant-day1@email.com",
                Username = "applicant-day1@hearings.reform.hmcts.net",
                HearingRoleName = "Applicant",
                UserRoleName = "Individual",
                LinkedParticipants = new List<LinkedParticipantResponseV2>()
            });
            day1Hearing.Endpoints.Add(new EndpointResponseV2
            {
                Id = Guid.NewGuid(),
                DisplayName = "Endpoint C"
            });
            day1Hearing.JudicialOfficeHolders.Add(new JudiciaryParticipantResponse
            {
                PersonalCode = Guid.NewGuid().ToString(),
                DisplayName = "PanelMember",
                HearingRoleCode = JudiciaryParticipantHearingRoleCode.PanelMember
            });
            
            BookingsApiClient.Setup(x => x.GetHearingsByGroupIdV2Async(groupId)).ReturnsAsync(existingHearingsInMultiDayGroup);
            
            var request = CreateV2EditMultiDayHearingRequest(day1Hearing);
            request.HearingsInGroup = new List<UpdateHearingInGroupRequest>();
            foreach (var hearingInGroup in existingHearingsInMultiDayGroup)
            {
                request.HearingsInGroup.Add(new UpdateHearingInGroupRequest
                {
                    HearingId = hearingInGroup.Id,
                    ScheduledDateTime = hearingInGroup.ScheduledDateTime
                });
            }
            request.UpdateFutureDays = true;
            
            var updatedHearing = MapUpdatedHearingV2(day1Hearing, request);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(updatedHearing);
            
            const string updatedBy = "updatedBy@email.com";
            UserIdentity.Setup(x => x.GetUserIdentityName()).Returns(updatedBy);
            
            // Act
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var expectedResponse = updatedHearing.Map();
            result.Result.Should().BeOfType<OkObjectResult>();
            var objectResult = result.Result.As<OkObjectResult>();
            objectResult.Value.Should().BeEquivalentTo(expectedResponse);

            // Day 1
            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupV2Async(
                groupId,
                It.Is<UpdateHearingsInGroupRequestV2>(r =>
                    r.Hearings.Exists(h => 
                        h.HearingId == day1Hearing.Id && 
                        h.Participants.ExistingParticipants.Count == day1Hearing.Participants.Count && 
                        h.Participants.NewParticipants.Count == 0 && 
                        h.Participants.RemovedParticipantIds.Count == 0 && 
                        h.Participants.LinkedParticipants.Count == 1 && 
                        h.Endpoints.ExistingEndpoints.Count == day1Hearing.Endpoints.Count && 
                        h.Endpoints.NewEndpoints.Count == 0 && 
                        h.Endpoints.RemovedEndpointIds.Count == 0 &&
                        h.JudiciaryParticipants.ExistingJudiciaryParticipants.Count == day1Hearing.JudicialOfficeHolders.Count &&
                        h.JudiciaryParticipants.NewJudiciaryParticipants.Count == 0 &&
                        h.JudiciaryParticipants.RemovedJudiciaryParticipantPersonalCodes.Count == 0
                        ))));
            
            // Day 2
            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupV2Async(
                groupId,
                It.Is<UpdateHearingsInGroupRequestV2>(r =>
                    r.Hearings.Exists(h => 
                        h.HearingId == day2Hearing.Id && 
                        h.Participants.ExistingParticipants.Count == day2Hearing.Participants.Count && 
                        h.Participants.NewParticipants.Count == 0 && 
                        h.Participants.RemovedParticipantIds.Count == 0 && 
                        h.Participants.LinkedParticipants.Count == 1 && 
                        h.Endpoints.ExistingEndpoints.Count == day2Hearing.Endpoints.Count && 
                        h.Endpoints.NewEndpoints.Count == 0 && 
                        h.Endpoints.RemovedEndpointIds.Count == 0 &&
                        h.JudiciaryParticipants.ExistingJudiciaryParticipants.Count == day2Hearing.JudicialOfficeHolders.Count &&
                        h.JudiciaryParticipants.NewJudiciaryParticipants.Count == 0 &&
                        h.JudiciaryParticipants.RemovedJudiciaryParticipantPersonalCodes.Count == 0
                        ))));
        }
        
        [Test]
        public async Task Should_remove_linked_participants()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var groupId = Guid.NewGuid();
            var scheduledDates = new List<DateTime>
            {
                DateTime.Today.AddDays(1).AddHours(10),
                DateTime.Today.AddDays(2).AddHours(10)
            };
            var existingHearingsInMultiDayGroup = CreateListOfV2HearingsInMultiDayGroupAsV2(groupId, hearingId, scheduledDates: scheduledDates);

            var day1Hearing = existingHearingsInMultiDayGroup[0];
       
            BookingsApiClient.Setup(x => x.GetHearingsByGroupIdV2Async(groupId)).ReturnsAsync(existingHearingsInMultiDayGroup);
            
            var request = CreateV2EditMultiDayHearingRequest(day1Hearing);
            var interpreterToRemove = request.Participants.Find(x => x.HearingRoleCode == "INTP");
            request.Participants.Remove(interpreterToRemove);
            request.HearingsInGroup = new List<UpdateHearingInGroupRequest>();
            foreach (var hearingInGroup in existingHearingsInMultiDayGroup)
            {
                request.HearingsInGroup.Add(new UpdateHearingInGroupRequest
                {
                    HearingId = hearingInGroup.Id,
                    ScheduledDateTime = hearingInGroup.ScheduledDateTime
                });
            }
            request.UpdateFutureDays = true;
            
            var updatedHearing = MapUpdatedHearingV2(day1Hearing, request);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(updatedHearing);
            
            const string updatedBy = "updatedBy@email.com";
            UserIdentity.Setup(x => x.GetUserIdentityName()).Returns(updatedBy);
            
            // Act
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var expectedResponse = updatedHearing.Map();
            result.Result.Should().BeOfType<OkObjectResult>();
            var objectResult = result.Result.As<OkObjectResult>();
            objectResult.Value.Should().BeEquivalentTo(expectedResponse);

            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupV2Async(
                groupId,
                It.Is<UpdateHearingsInGroupRequestV2>(r =>
                    r.Hearings.TrueForAll(h =>
                        h.Participants.ExistingParticipants.Count == day1Hearing.Participants.Count - 1 &&
                        h.Participants.RemovedParticipantIds.Count == 1 &&
                        h.Participants.LinkedParticipants.Count == 0
                        ))));
        }
        
        [Test]
        public async Task Should_update_multi_day_hearing_when_participant_is_new_to_edited_hearing_but_exists_on_future_days()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var groupId = Guid.NewGuid();
            var scheduledDates = new List<DateTime>
            {
                DateTime.Today.AddDays(1).AddHours(10),
                DateTime.Today.AddDays(2).AddHours(10)
            };
            var existingHearingsInMultiDayGroup = CreateListOfV2HearingsInMultiDayGroupAsV2(groupId, hearingId, scheduledDates: scheduledDates);
            
            // Add the participant to the future day hearing (day 2)
            var day1Hearing = existingHearingsInMultiDayGroup[0];
            var day2Hearing = existingHearingsInMultiDayGroup[1];
            var newParticipant = new ParticipantResponseV2
            {
                Id = Guid.NewGuid(),
                FirstName = "NewApplicantAlreadyOnDay2",
                LastName = "Test",
                ContactEmail = "applicant-day2@email.com",
                Username = "applicant-day2@hearings.reform.hmcts.net",
                HearingRoleName = "Applicant",
                UserRoleName = "Individual"
            };
            day2Hearing.Participants.Add(newParticipant);
            
            BookingsApiClient.Setup(x => x.GetHearingsByGroupIdV2Async(groupId)).ReturnsAsync(existingHearingsInMultiDayGroup);
            
            var request = CreateV2EditMultiDayHearingRequest(day1Hearing);
            request.HearingsInGroup = new List<UpdateHearingInGroupRequest>();
            foreach (var hearingInGroup in existingHearingsInMultiDayGroup)
            {
                request.HearingsInGroup.Add(new UpdateHearingInGroupRequest
                {
                    HearingId = hearingInGroup.Id,
                    ScheduledDateTime = hearingInGroup.ScheduledDateTime
                });
            }
            request.Participants.Add(new EditParticipantRequest
            {
                FirstName = newParticipant.FirstName,
                LastName = newParticipant.LastName,
                ContactEmail = newParticipant.ContactEmail,
                DisplayName = newParticipant.DisplayName,
                HearingRoleName = newParticipant.HearingRoleName,
                LinkedParticipants = new List<LinkedParticipant>()
            });
            request.UpdateFutureDays = true;
            
            var updatedHearing = MapUpdatedHearingV2(day1Hearing, request);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(updatedHearing);
            
            const string updatedBy = "updatedBy@email.com";
            UserIdentity.Setup(x => x.GetUserIdentityName()).Returns(updatedBy);
            
            // Act
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var expectedResponse = updatedHearing.Map();
            result.Result.Should().BeOfType<OkObjectResult>();
            var objectResult = result.Result.As<OkObjectResult>();
            objectResult.Value.Should().BeEquivalentTo(expectedResponse);

            // Day 1
            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupV2Async(
                groupId,
                It.Is<UpdateHearingsInGroupRequestV2>(r =>
                    r.Hearings.Exists(h => 
                        h.HearingId == day1Hearing.Id && 
                        h.Participants.ExistingParticipants.Count == day1Hearing.Participants.Count && 
                        h.Participants.NewParticipants.Count == 1 &&
                        h.Participants.NewParticipants.Exists(np => np.ContactEmail == newParticipant.ContactEmail) &&
                        h.Participants.RemovedParticipantIds.Count == 0 && 
                        h.Participants.LinkedParticipants.Count == 1
                        ))));
            
            // Day 2
            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupV2Async(
                groupId,
                It.Is<UpdateHearingsInGroupRequestV2>(r =>
                    r.Hearings.Exists(h => 
                        h.HearingId == day2Hearing.Id && 
                        h.Participants.ExistingParticipants.Count == day2Hearing.Participants.Count && 
                        h.Participants.NewParticipants.Count == 0 && 
                        h.Participants.RemovedParticipantIds.Count == 0 && 
                        h.Participants.LinkedParticipants.Count == 1
                    ))));
        }

        [Test]
        public async Task Should_reassign_judge_when_future_day_hearing_is_assigned_to_different_judge_on_v2()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var groupId = Guid.NewGuid();
            var scheduledDates = new List<DateTime>
            {
                DateTime.Today.AddDays(1).AddHours(10),
                DateTime.Today.AddDays(2).AddHours(10)
            };
            var existingHearingsInMultiDayGroup = CreateListOfV2HearingsInMultiDayGroupAsV2(groupId, hearingId, scheduledDates: scheduledDates);
            
            // Assign day 2 to a different judge
            var day1Hearing = existingHearingsInMultiDayGroup[0];
            var day2Hearing = existingHearingsInMultiDayGroup[1];
            var day1OldJudge = day1Hearing.JudicialOfficeHolders.Find(x => x.HearingRoleCode == JudiciaryParticipantHearingRoleCode.Judge);
            var day2OldJudge = day2Hearing.JudicialOfficeHolders.Find(x => x.HearingRoleCode == JudiciaryParticipantHearingRoleCode.Judge);
            day2OldJudge.PersonalCode = Guid.NewGuid().ToString();
            day2OldJudge.Email = "day2Judge@email.com";

            BookingsApiClient.Setup(x => x.GetHearingsByGroupIdV2Async(groupId)).ReturnsAsync(existingHearingsInMultiDayGroup);
            
            var request = CreateV2EditMultiDayHearingRequest(day1Hearing);
            request.HearingsInGroup = new List<UpdateHearingInGroupRequest>();
            foreach (var hearingInGroup in existingHearingsInMultiDayGroup)
            {
                request.HearingsInGroup.Add(new UpdateHearingInGroupRequest
                {
                    HearingId = hearingInGroup.Id,
                    ScheduledDateTime = hearingInGroup.ScheduledDateTime
                });
            }
            var newJudge = request.JudiciaryParticipants.Find(x => x.Role == "Judge");
            newJudge.PersonalCode = Guid.NewGuid().ToString();
            request.UpdateFutureDays = true;
            
            var updatedHearing = MapUpdatedHearingV2(day1Hearing, request);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(updatedHearing);
            
            const string updatedBy = "updatedBy@email.com";
            UserIdentity.Setup(x => x.GetUserIdentityName()).Returns(updatedBy);
            
            // Act
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var expectedResponse = updatedHearing.Map();
            result.Result.Should().BeOfType<OkObjectResult>();
            var objectResult = result.Result.As<OkObjectResult>();
            objectResult.Value.Should().BeEquivalentTo(expectedResponse);
            
            // Day 1
            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupV2Async(
                groupId,
                It.Is<UpdateHearingsInGroupRequestV2>(r =>
                    r.Hearings.Exists(h => 
                        h.HearingId == day1Hearing.Id &&
                        h.JudiciaryParticipants.NewJudiciaryParticipants.Count == 1 &&
                        h.JudiciaryParticipants.NewJudiciaryParticipants.Exists(x => x.PersonalCode == newJudge.PersonalCode) &&
                        h.JudiciaryParticipants.RemovedJudiciaryParticipantPersonalCodes.Count == 1 &&
                        h.JudiciaryParticipants.RemovedJudiciaryParticipantPersonalCodes.Contains(day1OldJudge.PersonalCode) &&
                        h.JudiciaryParticipants.ExistingJudiciaryParticipants.Count == day1Hearing.JudicialOfficeHolders.Count - 1
                    ))));
            
            // Day 2
            BookingsApiClient.Verify(x => x.UpdateHearingsInGroupV2Async(
                groupId,
                It.Is<UpdateHearingsInGroupRequestV2>(r =>
                    r.Hearings.Exists(h => 
                        h.HearingId == day2Hearing.Id &&
                        h.JudiciaryParticipants.NewJudiciaryParticipants.Count == 1 &&
                        h.JudiciaryParticipants.NewJudiciaryParticipants.Exists(x => x.PersonalCode == newJudge.PersonalCode) &&
                        h.JudiciaryParticipants.RemovedJudiciaryParticipantPersonalCodes.Count == 1 &&
                        h.JudiciaryParticipants.RemovedJudiciaryParticipantPersonalCodes.Contains(day2OldJudge.PersonalCode) &&
                        h.JudiciaryParticipants.ExistingJudiciaryParticipants.Count == day2Hearing.JudicialOfficeHolders.Count - 1
                    ))));
        }

        [Test]
        public async Task Should_forward_not_found_from_bookings_api()
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
            
            // Act
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var notFoundResult = (NotFoundObjectResult)result.Result;
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

            var request = CreateV2EditMultiDayHearingRequest(hearing);
            hearing.GroupId = null;
            
            var updatedHearing = MapUpdatedHearingV2(hearing, request);
            BookingsApiClient.Setup(x => x.GetHearingDetailsByIdV2Async(hearingId)).ReturnsAsync(updatedHearing);
            
            var validationProblemDetails = new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                {"hearingId", ["Hearing is not multi-day"] }
            });
            
            // Act
            var result = await Controller.EditMultiDayHearing(hearingId, request);
            
            // Assert
            var objectResult = (ObjectResult)result.Result;
            var validationProblems = (ValidationProblemDetails)objectResult.Value;
            
            var errors = validationProblems.Errors;
            errors.Should().BeEquivalentTo(validationProblemDetails.Errors);
        }
        
        private static HearingDetailsResponseV2 MapUpdatedHearingV2(
            HearingDetailsResponseV2 hearing, EditMultiDayHearingRequest request) =>
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
                JudicialOfficeHolders = request.JudiciaryParticipants.Select(x => new JudiciaryParticipantResponse
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

        private static EditMultiDayHearingRequest CreateV2EditMultiDayHearingRequest(HearingDetailsResponseV2 hearing) =>
            new()
            {
                ScheduledDuration = 90,
                HearingVenueCode = "701411",
                HearingRoomName = "HearingRoomName",
                OtherInformation = "OtherInformation",
                CaseNumber = "CaseNumber",
                AudioRecordingRequired = true,
                Participants = hearing.Participants.Select(x => new EditParticipantRequest
                {
                    Id = x.Id,
                    FirstName = x.FirstName,
                    LastName = x.LastName,
                    ContactEmail = x.ContactEmail,
                    DisplayName = x.DisplayName,
                    HearingRoleCode = x.HearingRoleCode,
                    LinkedParticipants = x.LinkedParticipants.Select(lp => new LinkedParticipant
                    {
                        Type = LinkedParticipantType.Interpreter,
                        //LinkedParticipantContactEmail = hearing.Participants.First(p => p.Id == lp.LinkedId).ContactEmail,
                        LinkedId = lp.LinkedId
                    }).ToList()
                }).ToList(),
                Endpoints = hearing.Endpoints.Select(x => new EditEndpointRequest
                {
                    Id = x.Id,
                    DisplayName = x.DisplayName
                }).ToList(),
                JudiciaryParticipants = hearing.JudicialOfficeHolders.Select(x => new JudiciaryParticipantRequest
                {
                    PersonalCode = x.PersonalCode,
                    Role = x.HearingRoleCode.ToString(),
                    DisplayName = x.DisplayName
                }).ToList()
            };
    }
}
