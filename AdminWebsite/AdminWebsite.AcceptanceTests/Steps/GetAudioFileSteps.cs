using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using TestApi.Contract.Dtos;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoApi.Contract.Responses;
using AcceptanceTests.Common.AudioRecordings;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class GetAudioFileSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;

        public GetAudioFileSteps(TestContext c, Dictionary<UserDto, UserBrowser> browsers)
        {
            _c = c;
            _browsers = browsers;
        }

        [Given(@"I have an audio recording for the closed conference")]
        public async Task GivenIHaveAnAudioRecordingForMainHearing()
        {
            var result = await _c.AzureStorage.First().VerifyAudioFileExistsInStorage();
            result.Should().BeTrue("Audio file successfully uploaded to Azure Storage");
            var response = _c.Api.GetConferenceByConferenceId(_c.Test.ConferenceResponse.Id);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var conference = RequestHelper.Deserialise<ConferenceDetailsResponse>(response.Content);
            conference.StartedDateTime.Should().NotBeNull();
            conference.ClosedDateTime.Should().NotBeNull();
            _c.Test.ConferenceResponse = conference;
        }

        [Given(@"I have an audio recording for the closed conference with an Interpreter")]
        public async Task GivenIHaveAnAudioRecordingForMainHearingAndInterpreter()
        {
            var fileName = $"{_c.Test.HearingResponse.Id}_interpreter";
            var file = FileManager.CreateNewAudioFile("TestAudioFile.mp4", fileName);

            var asm = new AzureStorageManager()
                .SetStorageAccountName(_c.WebConfig.Wowza.StorageAccountName)
                .SetStorageAccountKey(_c.WebConfig.Wowza.StorageAccountKey)
                .SetStorageContainerName(_c.WebConfig.Wowza.StorageContainerName)
                .CreateBlobClient(fileName);

            _c.AzureStorage.Add(asm);

            await asm.UploadAudioFileToStorage(file);
            FileManager.RemoveLocalAudioFile(file);

            for (int i = 0; i < _c.AzureStorage.Count(); i++)
            {
                var result = await _c.AzureStorage[i].VerifyAudioFileExistsInStorage();
                result.Should().BeTrue("Audio file successfully uploaded to Azure Storage");
            }

            var response = _c.Api.GetConferenceByConferenceId(_c.Test.ConferenceResponse.Id);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var conference = RequestHelper.Deserialise<ConferenceDetailsResponse>(response.Content);
            conference.StartedDateTime.Should().NotBeNull();
            conference.ClosedDateTime.Should().NotBeNull();
            _c.Test.ConferenceResponse = conference;
        }

        [When(@"I search for the audio recording by case number")]
        public void WhenISearchForTheAudioRecordingByCaseNumber()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(GetAudioFilePage.CaseNumberTextField).SendKeys(_c.Test.HearingResponse.Cases.First().Number);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementClickable(GetAudioFilePage.SubmitButton);
            _browsers[_c.CurrentUser].Click(GetAudioFilePage.SubmitButton);
        }

        [Then(@"the audio recording is retrieved")]
        public void ThenTheAudioRecordingIsRetrieved()
        {
            var hearing = _c.Test.HearingResponse;
            var caseDetails = hearing.Cases.First();
            var date = _c.TimeZone.Adjust(hearing.ScheduledDateTime).Date.ToString(DateFormats.AudioScheduledDate);
            _browsers[_c.CurrentUser].TextOf(GetAudioFilePage.ResultsCaseNumber(hearing.Id)).Should().Be(caseDetails.Number);
            _browsers[_c.CurrentUser].TextOf(GetAudioFilePage.ResultsScheduledTime(hearing.Id)).Should().Be(date);
            _browsers[_c.CurrentUser].TextOf(GetAudioFilePage.ResultsCaseName(hearing.Id)).Should().Be(caseDetails.Name);
            _browsers[_c.CurrentUser].TextOf(GetAudioFilePage.ResultsVenue(hearing.Id)).Should().Be($"{hearing.HearingVenueName} {hearing.HearingRoomName}");
        }

        [Then(@"the link can be retrieved")]
        [Then(@"the links can be retrieved")]
        public void ThenTheLinkCanBeRetrieved()
        {
            _browsers[_c.CurrentUser].Click(GetAudioFilePage.GetLinkButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(GetAudioFilePage.CopyLinkButton(0)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].ScrollTo(GetAudioFilePage.CopyLinkButton(0));

            for (int i = 0; i < _c.AzureStorage.Count(); i++)
            {
                _browsers[_c.CurrentUser].Click(GetAudioFilePage.CopyLinkButton(i));
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(GetAudioFilePage.LinkCopiedSuccessMessage(i)).Displayed.Should().BeTrue();
            }
        }
    }
}
