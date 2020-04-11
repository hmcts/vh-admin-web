using System.Collections.Generic;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Model.Participant;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class AssignJudgeSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly CommonSharedSteps _commonSharedSteps;
        public AssignJudgeSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, CommonSharedSteps commonSharedSteps)
        {
            _c = testContext;
            _browsers = browsers;
            _commonSharedSteps = commonSharedSteps;
        }

        [When(@"the user completes the assign judge form")]
        public void ProgressToNextPage()
        {
            _browsers[_c.CurrentUser.Key].WaitForPageToLoad();
            SetTheJudge();
            SetAudioRecording(_c.Test.TestData.AssignJudge.AudioRecord);
            ClickNext();
        }

        private void SetTheJudge()
        {
            var judge = UserManager.GetClerkUser(_c.UserAccounts);
            judge.CaseRoleName = Party.Judge.Name;
            judge.HearingRoleName = PartyRole.Judge.Name;
            _browsers[_c.CurrentUser.Key].Driver.WaitForListToBePopulated(AssignJudgePage.JudgeNameDropdown);
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser.Key].Driver, AssignJudgePage.JudgeNameDropdown, judge.Username);
            _c.Test.HearingParticipants.Add(judge);
        }

        private void SetAudioRecording(bool audioRecord)
        {
            _browsers[_c.CurrentUser.Key].ClickRadioButton(audioRecord
                ? AssignJudgePage.AudioRecordYesRadioButton
                : AssignJudgePage.AudioRecordNoRadioButton);
            _c.Test.AssignJudge.AudioRecord = audioRecord;
        }

        public void EditAudioRecording()
        {
            SetAudioRecording(!_c.Test.TestData.AssignJudge.AudioRecord);
            ClickNext();
        }

        public void ClickNext()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AssignJudgePage.NextButton);
            _browsers[_c.CurrentUser.Key].Click(AssignJudgePage.NextButton);
        }
    }
}
