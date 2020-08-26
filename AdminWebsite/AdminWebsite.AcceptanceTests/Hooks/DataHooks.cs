using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.AudioRecordings;
using AcceptanceTests.Common.Configuration.Users;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.VideoAPI.Client;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class DataHooks
    {
        private const int Timeout = 60;
        private readonly TestContext _c;

        public DataHooks(TestContext context)
        {
            _c = context;
        }

        [BeforeScenario(Order = (int)HooksSequence.DataHooks)]
        public void AddExistingUsers()
        {
            var exist = CheckIfParticipantsAlreadyExistInTheDb();

            if (!exist)
                CreateHearing();
        }

        [BeforeScenario(Order = (int)HooksSequence.AudioRecording)]
        public async Task AddAudioRecording(ScenarioContext scenario)
        {
            if (!scenario.ScenarioInfo.Tags.Contains("AudioRecording")) return;
            _c.Test.HearingResponse = CreateHearing();
            _c.Test.ConferenceResponse = CreateConference();
            StartTheHearing(); 
            CloseTheConference();

            var file = FileManager.CreateNewAudioFile("TestAudioFile.mp4", _c.Test.HearingResponse.Id);

            _c.AzureStorage = new AzureStorageManager()
                .SetStorageAccountName(_c.WebConfig.Wowza.StorageAccountName)
                .SetStorageAccountKey(_c.WebConfig.Wowza.StorageAccountKey)
                .SetStorageContainerName(_c.WebConfig.Wowza.StorageContainerName)
                .CreateBlobClient(_c.Test.HearingResponse.Id);

            await _c.AzureStorage.UploadAudioFileToStorage(file);
            FileManager.RemoveLocalAudioFile(file);
        }

        private bool CheckIfParticipantsAlreadyExistInTheDb()
        {
            var exist = false;

            foreach (var response in UserManager.GetNonClerkParticipantUsers(_c.UserAccounts).Select(participant => _c.Apis.UserApi.GetUser(participant.Username)))
            {
                exist = response.StatusCode == HttpStatusCode.OK;
            }
            return exist;
        }

        private HearingDetailsResponse CreateHearing()
        {
            var hearingRequest = new HearingRequestBuilder()
                .WithUserAccounts(_c.UserAccounts)
                .WithAudioRecording()
                .Build();

            var hearingResponse = _c.Apis.BookingsApi.CreateHearing(hearingRequest);
            hearingResponse.StatusCode.Should().Be(HttpStatusCode.Created);
            var hearing = RequestHelper.Deserialise<HearingDetailsResponse>(hearingResponse.Content);
            hearing.Should().NotBeNull();

            ParticipantExistsInTheDb(hearing.Id).Should().BeTrue();
            _c.Apis.UserApi.ParticipantsExistInAad(_c.UserAccounts, Timeout).Should().BeTrue();

            NUnit.Framework.TestContext.WriteLine($"Hearing created with Hearing Id {hearing.Id}");
            return hearing;
        }

        private ConferenceDetailsResponse CreateConference()
        {
            var updateRequest = new UpdateBookingStatusRequest
            {
                Status = UpdateBookingStatus.Created,
                Updated_by = UserManager.GetCaseAdminUser(_c.UserAccounts).Username
            };

            var response = _c.Apis.BookingsApi.ConfirmHearingToCreateConference(_c.Test.HearingResponse.Id, updateRequest);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent, $"Conference not created with error '{response.Content}'");
            response = _c.Apis.VideoApi.PollForConferenceResponse(_c.Test.HearingResponse.Id);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var conference = RequestHelper.Deserialise<ConferenceDetailsResponse>(response.Content);
            NUnit.Framework.TestContext.WriteLine($"Conference created with Conference Id {conference.Id}");
            return conference;
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

            var response = _c.Apis.VideoApi.SendEvent(request);
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

            var response = _c.Apis.VideoApi.SendEvent(request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        private bool ParticipantExistsInTheDb(Guid hearingId)
        {
            var hearingResponse = _c.Apis.BookingsApi.GetHearing(hearingId);
            var hearing = RequestHelper.Deserialise<HearingDetailsResponse>(hearingResponse.Content);
            hearing.Should().NotBeNull();
            return hearing.Participants.Any(x =>
                x.Username.ToLower().Equals(UserManager.GetDefaultParticipantUser(_c.UserAccounts).Username.ToLower()));
        }
    }
}
