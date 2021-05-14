using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.AudioRecordings;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.Services;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Requests.Enums;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using TechTalk.SpecFlow;
using TestApi.Contract.Enums;
using TestApi.Contract.Requests;
using TestApi.Contract.Responses;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using RoomType = AdminWebsite.Testing.Common.Data.RoomType;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class DataHooks
    {
        private const int ALLOCATE_USERS_FOR_MINUTES = 3;
        private readonly TestContext _c;
        private readonly ScenarioContext _scenario;

        public DataHooks(TestContext context, ScenarioContext scenario)
        {
            _c = context;
            _scenario = scenario;
        }

        [BeforeScenario(Order = (int)HooksSequence.DataHooks)]
        public async Task RetrievePublicHolidays()
        {
            var publicHolidayRetriever =
                new UkPublicHolidayRetriever(new HttpClient(), new MemoryCache(new MemoryCacheOptions()));
            _c.PublicHolidays = await  publicHolidayRetriever.RetrieveUpcomingHolidays();
        }
        
        [BeforeScenario(Order = (int)HooksSequence.DataHooks)]
        public void AddExistingUsers(ScenarioContext scenario)
        {
            AllocateUsers();

            var exist = CheckIfParticipantsAlreadyExistInTheDb();

            if (exist && !scenario.ScenarioInfo.Tags.Contains("QuestionnairesAlreadyPartiallyCompleted")) return;
            _c.Test.HearingResponse = CreateHearing();
            RefreshJudgeDropdownList();
        }

        private void AllocateUsers()
        {
            var userTypes = new List<UserType>
            {
                UserType.Judge,
                UserType.VideoHearingsOfficer
            };

            if (_scenario.ScenarioInfo.Tags.Contains(UserType.Winger.ToString()))
            {
                userTypes.Add(UserType.Winger);
                userTypes.Add(UserType.Individual);
            }
            else
            {
                userTypes.Add(UserType.CaseAdmin);
                userTypes.Add(UserType.Individual);
                userTypes.Add(UserType.Representative);
                userTypes.Add(UserType.PanelMember);
            }

            var request = new AllocateUsersRequest()
            {
                Application = Application.AdminWeb,
                ExpiryInMinutes = ALLOCATE_USERS_FOR_MINUTES,
                IsProdUser = _c.WebConfig.IsLive,
                IsEjud = _c.WebConfig.UsingEjud,
                TestType = TestType.Automated,
                UserTypes = userTypes
            };

            var response = _c.Api.AllocateUsers(request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Should().NotBeNull();
            var users = RequestHelper.Deserialise<List<UserDetailsResponse>>(response.Content);
            users.Should().NotBeNullOrEmpty();
            _c.Users = UserDetailsResponseToUsersMapper.Map(users);
            _c.Users.Should().NotBeNullOrEmpty();
        }

        [BeforeScenario(Order = (int)HooksSequence.AudioRecording)]
        public async Task AddAudioRecording(ScenarioContext scenario)
        {
            if (!scenario.ScenarioInfo.Tags.Contains("AudioRecording")) return;

            _c.Test.HearingResponse = CreateHearing(true);
            _c.Test.ConferenceResponse = CreateConference();
            StartTheHearing();
            CloseTheConference();

            var file = FileManager.CreateNewAudioFile("TestAudioFile.mp4", _c.Test.HearingResponse.Id.ToString());

            _c.AzureStorage = new AzureStorageManager()
                .SetStorageAccountName(_c.WebConfig.Wowza.StorageAccountName)
                .SetStorageAccountKey(_c.WebConfig.Wowza.StorageAccountKey)
                .SetStorageContainerName(_c.WebConfig.Wowza.StorageContainerName)
                .CreateBlobClient(_c.Test.HearingResponse.Id.ToString());

            await _c.AzureStorage.UploadAudioFileToStorage(file);
            FileManager.RemoveLocalAudioFile(file);
        }

        private bool CheckIfParticipantsAlreadyExistInTheDb()
        {
            var exist = false;

            foreach (var response in from user in _c.Users
                where user.UserType != UserType.CaseAdmin && user.UserType != UserType.VideoHearingsOfficer
                select _c.Api.GetPersonByUsername(user.Username))
            {
                exist = response.StatusCode == HttpStatusCode.OK;
            }

            return exist;
        }

        private HearingDetailsResponse CreateHearing(bool withAudioRecording = false)
        {
            var isWinger = _c.Users.Any(x => x.UserType == UserType.Winger);

            var hearingRequest = isWinger
                ? CreateHearingForWinger()
                : new HearingRequestBuilder()
                    .WithUsers(_c.Users)
                    .WithAudioRecordingRequired(withAudioRecording)
                    .Build();

            var hearingResponse = _c.Api.CreateHearing(hearingRequest);
            hearingResponse.StatusCode.Should().Be(HttpStatusCode.Created);
            var hearing = RequestHelper.Deserialise<HearingDetailsResponse>(hearingResponse.Content);
            hearing.Should().NotBeNull();
            ParticipantsShouldExistInTheDb(hearing.Id);
            NUnit.Framework.TestContext.WriteLine($"Hearing created with Hearing Id {hearing.Id}");
            return hearing;
        }

        private CreateHearingRequest CreateHearingForWinger()
        {
            return new HearingRequestBuilder()
                .WithUsers(_c.Users)
                .WithCACDCaseType()
                .WithAudioRecordingRequired(false)
                .Build();
        }

        private ConferenceDetailsResponse CreateConference()
        {
            var vho = _c.Users.First(x => x.UserType == UserType.VideoHearingsOfficer);

            var request = new UpdateBookingStatusRequest()
            {
                UpdatedBy = vho.Username,
                CancelReason = null,
                Status = UpdateBookingStatus.Created
            };

            var response = _c.Api.ConfirmHearingToCreateConference(_c.Test.HearingResponse.Id, request);
            response.StatusCode.Should().Be(HttpStatusCode.Created);
            var conference = RequestHelper.Deserialise<ConferenceDetailsResponse>(response.Content);
            NUnit.Framework.TestContext.WriteLine($"Conference created with Conference Id {conference.Id}");
            return conference;
        }

        private void ParticipantsShouldExistInTheDb(Guid hearingId)
        {
            var hearingResponse = _c.Api.GetHearing(hearingId);
            var hearing = RequestHelper.Deserialise<HearingDetailsResponse>(hearingResponse.Content);
            hearing.Should().NotBeNull();
            foreach (var user in _c.Users.Where(user =>
                user.UserType != UserType.CaseAdmin && user.UserType != UserType.VideoHearingsOfficer))
            {
                hearing.Participants.Any(x => x.LastName.Equals(user.LastName)).Should().BeTrue();
            }
        }

        private void StartTheHearing()
        {
            var judge = _c.Test.ConferenceResponse.Participants.First(x => x.UserRole == UserRole.Judge);

            var request = new ConferenceEventRequestBuilder()
                .WithConferenceId(_c.Test.ConferenceResponse.Id)
                .WithParticipantId(judge.Id)
                .WithEventType(EventType.Start)
                .FromRoomType(null)
                .Build();

            var response = _c.Api.SendEvent(request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        private void CloseTheConference()
        {
            var judge = _c.Test.ConferenceResponse.Participants.First(x => x.UserRole == UserRole.Judge);

            var request = new ConferenceEventRequestBuilder()
                .WithConferenceId(_c.Test.ConferenceResponse.Id)
                .WithParticipantId(judge.Id)
                .WithEventType(EventType.Close)
                .FromRoomType(RoomType.HearingRoom)
                .Build();

            var response = _c.Api.SendEvent(request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        private void RefreshJudgeDropdownList()
        {
            var response = _c.Api.RefreshJudgesCache();
            response.IsSuccessful.Should().BeTrue();
        }
    }
}