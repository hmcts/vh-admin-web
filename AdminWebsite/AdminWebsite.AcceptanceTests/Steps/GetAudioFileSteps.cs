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
        public async Task GivenIHaveAnAudioRecording()
        {
            var result = await _c.AzureStorage.VerifyAudioFileExistsInStorage();
            result.Should().BeTrue("Audio file successfully uploaded to Azure Storage");
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
        public void ThenTheLinkCanBeRetrieved()
        {
            _browsers[_c.CurrentUser].Click(GetAudioFilePage.GetLinkButton);
            _browsers[_c.CurrentUser].Click(GetAudioFilePage.CopyLinkButton(0));
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(GetAudioFilePage.LinkCopiedSuccessMessage(0)).Displayed.Should().BeTrue();
        }
    }
}
