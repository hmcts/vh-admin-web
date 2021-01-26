using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Models;
using AdminWebsite.Services;
using AdminWebsite.Services.Models;
using AdminWebsite.VideoAPI.Client;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Moq;
using NotificationApi.Client;
using NotificationApi.Contract.Requests;
using NUnit.Framework;
using User = AdminWebsite.Services.Models.User;

namespace AdminWebsite.UnitTests.Services
{
    public class HearingsServiceTests
    {
        private Mock<IUserAccountService> _userAccountService;
        private Mock<IVideoApiClient> _videoApiMock;
        private Mock<ILogger<HearingsService>> _hearingsServiceLogger;
        private Mock<INotificationApiClient> _notificationApiMock;
        private Mock<IPollyRetryService> _pollyRetryMock;
        private IHearingsService _hearingsService;

        private ParticipantResponse _pat1;
        private ParticipantResponse _pat2;
        private ParticipantResponse _pat3;
        private ParticipantResponse _judge;
        private HearingDetailsResponse _hearingDetailsResponse;

        [SetUp]
        public void Setup()
        {
            _userAccountService = new Mock<IUserAccountService>();
            _videoApiMock = new Mock<IVideoApiClient>();
            _hearingsServiceLogger = new Mock<ILogger<HearingsService>>();
            _notificationApiMock = new Mock<INotificationApiClient>();
            _pollyRetryMock = new Mock<IPollyRetryService>();
            _hearingsService = new HearingsService(_hearingsServiceLogger.Object, _notificationApiMock.Object,
                _pollyRetryMock.Object,
                _userAccountService.Object, _videoApiMock.Object);

            _pat1 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Representative")
                .With(x => x.Username = "username1@hmcts.net")
                .Build();
            _pat2 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Individual")
                .With(x => x.Username = "fname2.lname2@hmcts.net")
                .Build();
            _pat3 = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Individual")
                .With(x => x.Username = "fname3.lname3@hmcts.net")
                .Build();
            _judge = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.User_role_name = "Judge")
                .With(x => x.Username = "judge.fudge@hmcts.net")
                .Build();

            _hearingDetailsResponse = Builder<HearingDetailsResponse>.CreateNew()
                .With(x => x.Participants = new List<ParticipantResponse> { _pat1, _pat2, _pat3, _judge }).Build();
        }

        [Test]
        public async Task Should_create_notifications_for_all_participants()
        {
            var participantList = _hearingDetailsResponse.Participants.Where(p => p.User_role_name != "Judge").ToList();
            var usernameAdIdDict = new Dictionary<string, User>();
            foreach (var participant in participantList)
            {
                var key = participant.Username;
                var user = new User{UserName = participant.Username.Split('@')[0], Password = "password1234"};
                usernameAdIdDict.Add(key, user);
            }

            await _hearingsService.EmailParticipants(_hearingDetailsResponse, usernameAdIdDict);

            _notificationApiMock.Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Exactly(3));
        }

        [Test]
        public async Task Should_create_notifications_for_all_but_one_participant_who_has_no_password()
        {
            _hearingDetailsResponse = Builder<HearingDetailsResponse>.CreateNew()
                .With(x => x.Participants = new List<ParticipantResponse> { _pat1, _pat2 }).Build();

            var participantList = _hearingDetailsResponse.Participants.ToList();
            var usernameAdIdDict = new Dictionary<string, User>();
            foreach (var participant in participantList)
            {
                var key = participant.Username;
                var password = participant.Username != _pat1.Username ? "password1234" : string.Empty;
                var user = new User { UserName = participant.Username.Split('@')[0], Password = password };
                usernameAdIdDict.Add(key, user);
            }

            await _hearingsService.EmailParticipants(_hearingDetailsResponse, usernameAdIdDict);

            _notificationApiMock.Verify(x => x.CreateNewNotificationAsync(It.IsAny<AddNotificationRequest>()), Times.Exactly(1));
        }

        [Test]
        public async Task Should_log_no_users_in_dictionary()
        {
            _pollyRetryMock.Setup(x => x.WaitAndRetryAsync<Exception, Task>
                (
                    It.IsAny<int>(), It.IsAny<Func<int, TimeSpan>>(), It.IsAny<Action<int>>(),
                    It.IsAny<Func<Task, bool>>(), It.IsAny<Func<Task<Task>>>()
                ))
                .Callback(async (int retries, Func<int, TimeSpan> sleepDuration, Action<int> retryAction,
                    Func<Task, bool> handleResultCondition, Func<Task> executeFunction) =>
                {
                    sleepDuration(1);
                    retryAction(1);
                    handleResultCondition(Task.CompletedTask);
                    await executeFunction();
                })
                .ReturnsAsync(Task.CompletedTask);

            var emptyDictionary = new Dictionary<string, User>();
            var expectedLogMsg =
                $"AssignParticipantToCorrectGroups - No users in dictionary for hearingId: {_hearingDetailsResponse.Id}";

            await _hearingsService.AssignParticipantToCorrectGroups(_hearingDetailsResponse, emptyDictionary);

            _hearingsServiceLogger.Verify(x => x.Log(
                It.Is<LogLevel>(l => l == LogLevel.Debug),
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString() == expectedLogMsg),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception, string>>((v, t) => true)));
        }

        [Test]
        public async Task Should_assign_users_to_the_correct_group()
        {
            _pollyRetryMock.Setup(x => x.WaitAndRetryAsync<Exception, Task>
                (
                    It.IsAny<int>(), It.IsAny<Func<int, TimeSpan>>(), It.IsAny<Action<int>>(),
                    It.IsAny<Func<Task, bool>>(), It.IsAny<Func<Task<Task>>>()
                ))
                .Callback(async (int retries, Func<int, TimeSpan> sleepDuration, Action<int> retryAction,
                    Func<Task, bool> handleResultCondition, Func<Task> executeFunction) =>
                {
                    sleepDuration(1);
                    retryAction(1);
                    handleResultCondition(Task.CompletedTask);
                    await executeFunction();
                })
                .ReturnsAsync(Task.CompletedTask);

            var participantList = _hearingDetailsResponse.Participants.ToList();
            var usernameAdIdDict = new Dictionary<string, User>();
            foreach (var participant in participantList)
            {
                var key = participant.Username;
                var user = new User { UserName = participant.Username.Split('@')[0], Password = "password1234" };
                usernameAdIdDict.Add(key, user);
            }

            await _hearingsService.AssignParticipantToCorrectGroups(_hearingDetailsResponse, usernameAdIdDict);

            _userAccountService.Verify( x=> x.AssignParticipantToGroup(It.IsAny<string>(), It.IsAny<string>()), Times.Exactly(4));
            _hearingsServiceLogger.Verify(x => x.Log(
                It.Is<LogLevel>(l => l == LogLevel.Debug),
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().StartsWith("AssignParticipantToGroupWithRetry - Added username:")),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception, string>>((v, t) => true)));
        }

        [Test]
        public async Task Should_update_booking_reference()
        {
            var hearingId = Guid.NewGuid();
            var errorMessage = "should fail in this one";
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse
            {
                Id = Guid.NewGuid(),
                Hearing_id = hearingId,
                Meeting_room = new MeetingRoomResponse
                {
                    Admin_uri = "admin",
                    Judge_uri = "judge",
                    Participant_uri = "participant",
                    Pexip_node = "pexip",
                    Telephone_conference_id = "121212"
                }
            };
            _pollyRetryMock.Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
                (
                    It.IsAny<int>(), It.IsAny<Func<int, TimeSpan>>(), It.IsAny<Action<int>>(),
                    It.IsAny<Func<ConferenceDetailsResponse, bool>>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>()
                ))
                .Callback(async (int retries, Func<int, TimeSpan> sleepDuration, Action<int> retryAction,
                    Func<ConferenceDetailsResponse, bool> handleResultCondition, Func<Task<ConferenceDetailsResponse>> executeFunction) =>
                {
                    sleepDuration(1);
                    retryAction(1);
                    handleResultCondition(expectedConferenceDetailsResponse);
                    await executeFunction();
                })
                .ReturnsAsync(expectedConferenceDetailsResponse);
            _videoApiMock.Setup(x => x.GetConferenceByHearingRefIdAsync(hearingId)).ReturnsAsync(expectedConferenceDetailsResponse);

            var result = await _hearingsService.UpdateBookingReference(hearingId, errorMessage);

            result.Successful.Should().BeTrue();
            result.UpdateResponse.Should().BeEquivalentTo(expectedConferenceDetailsResponse);
        }

        [Test]
        public async Task Should_update_booking_reference_but_fails_and_returns_false()
        {
            var hearingId = Guid.NewGuid();
            var errorMessage = "should fail in this one";
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse();

            _pollyRetryMock.Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
            (
                It.IsAny<int>(), It.IsAny<Func<int, TimeSpan>>(), It.IsAny<Action<int>>(),
                It.IsAny<Func<ConferenceDetailsResponse, bool>>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>()
            ))
            .Callback(async (int retries, Func<int, TimeSpan> sleepDuration, Action<int> retryAction,
                Func<ConferenceDetailsResponse, bool> handleResultCondition, Func<Task<ConferenceDetailsResponse>> executeFunction) =>
            {
                sleepDuration(1);
                retryAction(1);
                handleResultCondition(expectedConferenceDetailsResponse);
                await executeFunction();
            })
            .ReturnsAsync(expectedConferenceDetailsResponse);

            _videoApiMock.Setup(x => x.GetConferenceByHearingRefIdAsync(hearingId)).ReturnsAsync(expectedConferenceDetailsResponse);

            var result = await _hearingsService.UpdateBookingReference(hearingId, errorMessage);

            result.Successful.Should().BeFalse();
            result.UpdateResponse.Should().BeEquivalentTo(expectedConferenceDetailsResponse);
        }

        [Test]
        public async Task Should_update_booking_reference_but_throws_exception()
        {
            var hearingId = Guid.NewGuid();
            var errorMessage = "should fail in this one";
            var expectedConferenceDetailsResponse = new ConferenceDetailsResponse();
            var videoApiExceptionHeaders = new Dictionary<string, IEnumerable<string>>();
            videoApiExceptionHeaders.Add("key",new List<string>() { "200" });
            var videoApiException = new VideoApiException("failed", 1,"response", videoApiExceptionHeaders, null);

            _pollyRetryMock.Setup(x => x.WaitAndRetryAsync<VideoApiException, ConferenceDetailsResponse>
                (
                    It.IsAny<int>(), It.IsAny<Func<int, TimeSpan>>(), It.IsAny<Action<int>>(),
                    It.IsAny<Func<ConferenceDetailsResponse, bool>>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>()
                ))
                .Callback(async (int retries, Func<int, TimeSpan> sleepDuration, Action<int> retryAction,
                    Func<ConferenceDetailsResponse, bool> handleResultCondition,
                    Func<Task<ConferenceDetailsResponse>> executeFunction) =>
                {
                    sleepDuration(1);
                    retryAction(1);
                    handleResultCondition(expectedConferenceDetailsResponse);
                    await executeFunction();
                })
                .ThrowsAsync(videoApiException);

            _videoApiMock.Setup(x => x.GetConferenceByHearingRefIdAsync(hearingId)).ThrowsAsync(videoApiException);

            UpdateBookingReferenceResult result = await _hearingsService.UpdateBookingReference(hearingId, errorMessage);

            result.Successful.Should().BeFalse();
            result.UpdateResponse.Should().BeNull();
            _hearingsServiceLogger.Verify(x => x.Log(
                It.Is<LogLevel>(l => l == LogLevel.Error),
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().StartsWith(errorMessage)),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception, string>>((v, t) => true)));
        }

        [Test]
        public async Task  Should_populate_userIds_and_usernames()
        {
            string expectedPassword = null;
            var emptyDictionary = new Dictionary<string, User>();

            var pat1 = Builder<BookingsAPI.Client.ParticipantRequest>.CreateNew()
                .With(x => x.Username = "username1@hmcts.net")
                .With(x => x.Case_role_name = "Representative")
                .Build();
            var pat2 = Builder<BookingsAPI.Client.ParticipantRequest>.CreateNew()
                .With(x => x.Username = "fname2.lname2@hmcts.net")
                .With(x => x.Case_role_name = "Individual")
                .Build();
            var pat3 = Builder<BookingsAPI.Client.ParticipantRequest>.CreateNew()
                .With(x => x.Username = "fname3.lname3@hmcts.net")
                .With(x => x.Case_role_name = "Individual")
                .Build();

            var participants = new []{ pat1, pat2, pat3};
            
            var usernameAdIdDict = new Dictionary<string, User>();
            foreach (var participant in participants)
            {
                var key = participant.Username;
                var user = new User { UserName = participant.Username.Split('@')[0], Password = expectedPassword };
                usernameAdIdDict.Add(key, user);
            }

            _userAccountService.Setup( x=> x.GetAdUserIdForUsername(It.IsAny<string>())).ReturnsAsync((string s) => s.Split('@')[0]);
            _userAccountService.Setup(x => x.UpdateParticipantUsername(It.Is<BookingsAPI.Client.ParticipantRequest>(x => x == pat1)))
                .ReturnsAsync((ParticipantRequest s) => new User() { UserName = s.Username, Password = expectedPassword });
            _userAccountService.Setup(x => x.UpdateParticipantUsername(It.Is<BookingsAPI.Client.ParticipantRequest>(x => x == pat2)))
                .ReturnsAsync((ParticipantRequest s) => new User() { UserName = s.Username, Password = expectedPassword });
            _userAccountService.Setup(x => x.UpdateParticipantUsername(It.Is<BookingsAPI.Client.ParticipantRequest>(x => x == pat3)))
                .ReturnsAsync((ParticipantRequest s) => new User() { UserName = s.Username, Password = expectedPassword });

            await _hearingsService.PopulateUserIdsAndUsernames(participants, emptyDictionary);

            emptyDictionary.Should().BeEquivalentTo(usernameAdIdDict);
        }

        [Test]
        public async Task Should_assign_endpoint_defence_advocates()
        {
            var pat1 = Builder<BookingsAPI.Client.ParticipantRequest>.CreateNew()
                .With(x => x.Username = "username1@hmcts.net")
                .With(x => x.Case_role_name = "Representative")
                .Build();
            var pat2 = Builder<BookingsAPI.Client.ParticipantRequest>.CreateNew()
                .With(x => x.Username = "fname2.lname2@hmcts.net")
                .With(x => x.Case_role_name = "Individual")
                .Build();

            var participants = new[] { pat1, pat2 };

            var request = new BookNewHearingRequest
            {
                Endpoints = new List<EndpointRequest>
                {
                    new EndpointRequest
                        {Display_name = "displayname1", Defence_advocate_username = "username1@hmcts.net"},
                    new EndpointRequest
                        {Display_name = "displayname2", Defence_advocate_username = "fname2.lname2@hmcts.net"},
                }
            };

            _hearingsService.AssignEndpointDefenceAdvocates(request.Endpoints, participants);

            request.Endpoints[0].Defence_advocate_username.Should().Be(pat1.Username);
            request.Endpoints[1].Defence_advocate_username.Should().Be(pat2.Username);
        }

        [Test]
        public void Should_map_hearing_edit_request_to_update_request()
        {
            var editRequest = Builder<EditHearingRequest>.CreateNew().Build();
            editRequest.Case = new EditCaseRequest() {Name = "case", Number = "CASE-001"};
            var updater = "updater@email.com";

            var updateRequest = _hearingsService.MapHearingUpdateRequest(editRequest, updater);

            updateRequest.Hearing_room_name.Should().Be(editRequest.HearingRoomName);
            updateRequest.Hearing_venue_name.Should().Be(editRequest.HearingVenueName);
            updateRequest.Other_information.Should().Be(editRequest.OtherInformation);
            updateRequest.Scheduled_date_time.Should().Be(editRequest.ScheduledDateTime);
            updateRequest.Scheduled_duration.Should().Be(editRequest.ScheduledDuration);
            updateRequest.Cases[0].Name.Should().Be(editRequest.Case.Name);
            updateRequest.Cases[0].Number.Should().Be(editRequest.Case.Number);
            updateRequest.Questionnaire_not_required.Should().BeFalse();
            updateRequest.Audio_recording_required.Should().Be(editRequest.AudioRecordingRequired);
        }

        [Test]
        public void Should_map_edit_participant_request_to_update_request()
        {
            var editRequest = Builder<EditParticipantRequest>.CreateNew().Build();

            var updateRequest = _hearingsService.MapUpdateParticipantRequest(editRequest);

            updateRequest.Title.Should().Be(editRequest.Title);
            updateRequest.Display_name.Should().Be(editRequest.DisplayName);
            updateRequest.Organisation_name.Should().Be(editRequest.OrganisationName);
            updateRequest.Telephone_number.Should().Be(editRequest.TelephoneNumber);
            updateRequest.Representee.Should().Be(editRequest.Representee);
        }

        [Test]
        public void Should_map_edit_participant_request_to_new_request()
        {
            var editRequest = Builder<EditParticipantRequest>.CreateNew().Build();

            var newParticipant = _hearingsService.MapNewParticipantRequest(editRequest);

            newParticipant.Case_role_name.Should().Be(editRequest.CaseRoleName);
            newParticipant.Contact_email.Should().Be(editRequest.ContactEmail);
            newParticipant.Display_name.Should().Be(editRequest.DisplayName);
            newParticipant.First_name.Should().Be(editRequest.FirstName);
            newParticipant.Last_name.Should().Be(editRequest.LastName);
            newParticipant.Hearing_role_name.Should().Be(editRequest.HearingRoleName);
            newParticipant.Middle_names.Should().Be(editRequest.MiddleNames);
            newParticipant.Representee.Should().Be(editRequest.Representee);
            newParticipant.Title.Should().Be(editRequest.Title);
            newParticipant.Organisation_name.Should().Be(editRequest.OrganisationName);
            newParticipant.Telephone_number.Should().Be(editRequest.TelephoneNumber);
        }
    }
}
