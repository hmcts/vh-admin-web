using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.AudioRecordings;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.TestAPI.Client;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class DataHooks
    {
        private const int ALLOCATE_USERS_FOR_MINUTES = 3;
        private readonly TestContext _c;

        public DataHooks(TestContext context)
        {
            _c = context;
        }

        [BeforeScenario(Order = (int)HooksSequence.DataHooks)]
        public void AddExistingUsers(ScenarioContext scenario)
        {
            AllocateUsers();

            var exist = CheckIfParticipantsAlreadyExistInTheDb();

            if (!exist || scenario.ScenarioInfo.Tags.Contains("QuestionnairesAlreadyPartiallyCompleted"))
            {
                _c.Test.HearingResponse = CreateHearing();
                RefreshJudgeDropdownList();
            }
        }

        private void AllocateUsers()
        {
            var userTypes = new List<UserType>
            {
                UserType.Judge,
                UserType.VideoHearingsOfficer,
                UserType.CaseAdmin,
                UserType.Individual,
                UserType.Representative
            };

            var request = new AllocateUsersRequest()
            {
                Application = Application.AdminWeb,
                Expiry_in_minutes = ALLOCATE_USERS_FOR_MINUTES,
                Is_prod_user = _c.WebConfig.IsLive,
                Test_type = TestType.Automated,
                User_types = userTypes
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

            foreach (var response in from user in _c.Users where user.User_type != UserType.CaseAdmin && user.User_type != UserType.VideoHearingsOfficer 
                select _c.Api.GetPersonByUsername(user.Username))
            {
                exist = response.StatusCode == HttpStatusCode.OK;
            }

            return exist;
        }

        public HearingDetailsResponse CreateHearing(bool withAudioRecording = false)
        {
            var hearingRequest = new HearingRequestBuilder()
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

        public ConferenceDetailsResponse CreateConference()
        {
            var vho = _c.Users.First(x => x.User_type == UserType.VideoHearingsOfficer);

            var request = new UpdateBookingStatusRequest()
            {
                Updated_by = vho.Username,
                AdditionalProperties = null,
                Cancel_reason = null,
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
            foreach (var user in _c.Users.Where(user => user.User_type != UserType.CaseAdmin && user.User_type != UserType.VideoHearingsOfficer))
            {
                hearing.Participants.Any(x => x.Last_name.Equals(user.Last_name)).Should().BeTrue();
            }
        }

        private void StartTheHearing()
        {
            var judge = _c.Test.ConferenceResponse.Participants.First(x => x.User_role == UserRole.Judge);
            
            var request = new CallbackEventRequestBuilder()
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
            var judge = _c.Test.ConferenceResponse.Participants.First(x => x.User_role == UserRole.Judge);
            
            var request = new CallbackEventRequestBuilder()
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
