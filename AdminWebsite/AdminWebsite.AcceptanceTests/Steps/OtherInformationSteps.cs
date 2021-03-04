using System;
using System.Collections.Generic;
using System.Threading;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.TestAPI.Client;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class OtherInformationSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;
        public OtherInformationSteps(TestContext testContext, Dictionary<User, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        [When(@"the user completes the other information form")]
        public void ProgressToNextPage()
        {
            Thread.Sleep(TimeSpan.FromSeconds(1));
            SetOtherInformation();
            _browsers[_c.CurrentUser].Clear(OtherInformationPage.OtherInformationTextfield);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(OtherInformationPage.OtherInformationTextfield).SendKeys(_c.Test.TestData.OtherInformationDetails.OtherInformation);
            ClickNext();
        }

        [When(@"the user sets audio recording to No")]
        public void WhenTheUserSetsAudioRecordingToNo()
        {
            SetAudioRecording(_c.Test.AssignJudge.AudioRecord);
            ProgressToNextPage();
        }


        private void SetOtherInformation()
        {
            _c.Test.OtherInformation = _c.Test.OtherInformation != null ? "Updated other information" : _c.Test.TestData.OtherInformationDetails.OtherInformation;
        }

        public void ClickNext()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(OtherInformationPage.NextButton);
            _browsers[_c.CurrentUser].Click(OtherInformationPage.NextButton);
        }

        private void SetAudioRecording(bool audioRecord)
        {
            _browsers[_c.CurrentUser].ClickRadioButton(audioRecord
                ? OtherInformationPage.AudioRecordYesRadioButton
                : OtherInformationPage.AudioRecordNoRadioButton);
            _c.Test.AssignJudge.AudioRecord = audioRecord;
        }
    }
}
