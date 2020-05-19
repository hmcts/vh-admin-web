using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.VideoAPI.Client;
using FluentAssertions;
using OpenQA.Selenium;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class GetAudioFileSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;

        public GetAudioFileSteps(TestContext c, Dictionary<string, UserBrowser> browsers)
        {
            _c = c;
            _browsers = browsers;
        }

        [Given(@"I have an audio recording for the closed conference")]
        public async Task GivenIHaveAnAudioRecording()
        {
            var result = await _c.Wowza.VerifyAudioFileExistsInStorage();
            result.Should().BeTrue("Audio file successfully uploaded to Wowza");
            var response = _c.Apis.VideoApi.GetConferenceByConferenceId(_c.Test.ConferenceResponse.Id);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var hearing = RequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(response.Content);
            hearing.Closed_date_time.Should().NotBeNull();
        }

        [When(@"I attempt an invalid search by case number")]
        public void WhenIAttemptAnInvalidSearchByCaseNumber()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(GetAudioFilePage.CaseNumberTextField).SendKeys(Keys.Tab);
        }

        [Then(@"an error message for the invalid case number appears")]
        public void ThenAnErrorMessageAppearsStating()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(GetAudioFilePage.InvalidCaseNumberError).Displayed.Should().BeTrue();
        }

        [When(@"I search for the audio recording by case number")]
        public void WhenISearchForTheAudioRecordingByCaseNumber()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(GetAudioFilePage.CaseNumberTextField).SendKeys(_c.Test.HearingResponse.Cases.First().Number);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementClickable(GetAudioFilePage.SubmitButton);
            _browsers[_c.CurrentUser.Key].Click(GetAudioFilePage.SubmitButton);
        }

        [Then(@"the audio recording is retrieved")]
        public void ThenTheAudioRecordingIsRetrieved()
        {
            var hearing = _c.Test.HearingResponse;
            var caseDetails = hearing.Cases.First();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(GetAudioFilePage.ResultsCaseNumber(hearing.Id)).Text.Trim().Should().Be(caseDetails.Number);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(GetAudioFilePage.ResultsScheduledTime(hearing.Id)).Text.Trim().Should().Be(hearing.Scheduled_date_time.Date.ToString(DateFormats.AudioScheduledDate));
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(GetAudioFilePage.ResultsCaseName(hearing.Id)).Text.Trim().Should().Be(caseDetails.Name);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(GetAudioFilePage.ResultsVenue(hearing.Id)).Text.Trim().Should().Be($"{hearing.Hearing_venue_name} {hearing.Hearing_room_name}");
        }

        [When(@"I attempt to get the link")]
        public void WhenIAttemptToGetTheLink()
        {
            _browsers[_c.CurrentUser.Key].Click(GetAudioFilePage.GetLinkButton);
            _browsers[_c.CurrentUser.Key].Click(GetAudioFilePage.CopyLinkButton);
        }

        [Then(@"the link is retrieved")]
        public void ThenTheLinkIsRetrieved()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(GetAudioFilePage.LinkCopiedSuccessMessage).Displayed.Should().BeTrue();
        }
    }
}
