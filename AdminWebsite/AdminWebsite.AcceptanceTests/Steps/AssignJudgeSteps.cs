using System;
using System.Collections.Generic;
using System.Threading;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Model.Participant;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.TestAPI.Client;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class AssignJudgeSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;
        private readonly CommonSharedSteps _commonSharedSteps;
        public AssignJudgeSteps(TestContext testContext, Dictionary<User, UserBrowser> browsers, CommonSharedSteps commonSharedSteps)
        {
            _c = testContext;
            _browsers = browsers;
            _commonSharedSteps = commonSharedSteps;
        }

        [When(@"the user completes the assign judge form")]
        public void ProgressToNextPage()
        {
            _browsers[_c.CurrentUser].WaitForPageToLoad();
            SetTheJudge();
            SetAudioRecording(_c.Test.TestData.AssignJudge.AudioRecord);
            ClickNext();
        }

        private void SetTheJudge()
        {
            var judgeUser = Users.GetJudgeUser(_c.Users);
            var judge = UserToUserAccountMapper.Map(judgeUser);
            judge.CaseRoleName = Party.Judge.Name;
            judge.HearingRoleName = PartyRole.Judge.Name;
            _browsers[_c.CurrentUser].Driver.WaitForListToBePopulated(AssignJudgePage.JudgeNameDropdown);
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver, AssignJudgePage.JudgeNameDropdown, judge.Username);
            _c.Test.HearingParticipants.Add(judge);
        }

        private void SetAudioRecording(bool audioRecord)
        {
            _browsers[_c.CurrentUser].ClickRadioButton(audioRecord
                ? AssignJudgePage.AudioRecordYesRadioButton
                : AssignJudgePage.AudioRecordNoRadioButton);
            _c.Test.AssignJudge.AudioRecord = audioRecord;
        }

        public void EditAudioRecording()
        {
            Thread.Sleep(TimeSpan.FromSeconds(1));
            SetAudioRecording(!_c.Test.TestData.AssignJudge.AudioRecord);
            ClickNext();
            Thread.Sleep(TimeSpan.FromSeconds(1));
        }

        public void ClickNext()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AssignJudgePage.NextButton);
            _browsers[_c.CurrentUser].Click(AssignJudgePage.NextButton);
        }
    }
}
