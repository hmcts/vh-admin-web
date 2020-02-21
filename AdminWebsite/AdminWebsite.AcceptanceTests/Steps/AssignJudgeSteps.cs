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
            SetTheJudge();
            ClickNext();
        }

        private void SetTheJudge()
        {
            var judge = UserManager.GetClerkUser(_c.UserAccounts);
            judge.CaseRoleName = Party.Judge.Name;
            judge.HearingRoleName = PartyRole.Judge.Name;
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser.Key].Driver, AssignJudgePage.JudgeNameDropdown, judge.Username);
            _c.Test.HearingParticipants.Add(judge);
        }

        public void ClickNext()
        {
            _browsers[_c.CurrentUser.Key].Click(AssignJudgePage.NextButton);
        }
    }
}
