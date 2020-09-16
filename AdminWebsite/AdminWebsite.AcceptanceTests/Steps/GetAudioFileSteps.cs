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
using AdminWebsite.TestAPI.Client;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class GetAudioFileSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;

        public GetAudioFileSteps(TestContext c, Dictionary<User, UserBrowser> browsers)
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
            conference.Started_date_time.Should().NotBeNull();
            conference.Closed_date_time.Should().NotBeNull();
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
            var date = _c.TimeZone.Adjust(hearing.Scheduled_date_time).Date.ToString(DateFormats.AudioScheduledDate);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(GetAudioFilePage.ResultsCaseNumber(hearing.Id)).Text.Trim().Should().Be(caseDetails.Number);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(GetAudioFilePage.ResultsScheduledTime(hearing.Id)).Text.Trim().Should().Be(date);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(GetAudioFilePage.ResultsCaseName(hearing.Id)).Text.Trim().Should().Be(caseDetails.Name);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(GetAudioFilePage.ResultsVenue(hearing.Id)).Text.Trim().Should().Be($"{hearing.Hearing_venue_name} {hearing.Hearing_room_name}");
        }

        [When(@"I attempt to get the link")]
        public void WhenIAttemptToGetTheLink()
        {
            _browsers[_c.CurrentUser].Click(GetAudioFilePage.GetLinkButton);
            _browsers[_c.CurrentUser].Click(GetAudioFilePage.CopyLinkButton);
        }

        [Then(@"the link is retrieved")]
        public void ThenTheLinkIsRetrieved()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(GetAudioFilePage.LinkCopiedSuccessMessage).Displayed.Should().BeTrue();
        }
    }
}
