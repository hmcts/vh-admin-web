using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Model.Participant;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using TestApi.Contract.Dtos;
using FluentAssertions;
using TechTalk.SpecFlow;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class AssignJudgeSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly CommonSharedSteps _commonSharedSteps;

        private UserAccount Judge => _c.Test.HearingParticipants.FirstOrDefault(c => c.HearingRoleName == "Judge");
        private string JudgePhone => "01234567890";

        public AssignJudgeSteps(TestContext testContext, Dictionary<UserDto, UserBrowser> browsers, CommonSharedSteps commonSharedSteps)
        {
            _c = testContext;
            _browsers = browsers;
            _commonSharedSteps = commonSharedSteps;
        }

        [When(@"the user completes the assign judge form")]
        public void ProgressToNextPage()
        {
            JudgeSteps(false);
        }

        [When(@"the user completes the assign judge form with phone and email")]
        public void WhenTheUserCompletesTheAssignJudgeFormWithPhoneAndEmail()
        {
            JudgeSteps(true);
        }

        private void JudgeSteps(bool updatePhoneAndEmail)
        {
            _browsers[_c.CurrentUser].WaitForPageToLoad();
            SetTheJudge();
            if (updatePhoneAndEmail)
            {
                SetJudgeEmailAndPhone();
            }

            if (_c.Test.AssignJudge.AddNewStaff)
            {
                SetTheNewStaff();
            }
            ClickNext();
        }

        [Then(@"the email and phone details are updated")]
        public void ThenTheEmailAndPhoneDetailsAreUpdated()
        {
            _browsers[_c.CurrentUser].TextOf(AssignJudgePage.JudgeEmailId).Should().Be(Judge.AlternativeEmail);
            _browsers[_c.CurrentUser].TextOf(AssignJudgePage.JudgePhoneId).Should().Be(JudgePhone);
        }

        private void SetTheJudge()
        {
            var judgeUser = Users.GetJudgeUser(_c.Users);
            var judge = UserToUserAccountMapper.Map(judgeUser);
            judge.CaseRoleName = Party.Judge.Name;
            judge.HearingRoleName = PartyRole.Judge.Name;
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AssignJudgePage.JudgeSearchField).SendKeys(judge.Username);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AssignJudgePage.SearchResults).FindElements(By.TagName("li")).FirstOrDefault().Click();
            _c.Test.HearingParticipants.Add(judge);
        }

        private void SetTheNewStaff()
        {
            string staffMemberDisplayName = "Auto Staff Member";
            string staffMemberRole = "Staff Member";

            _browsers[_c.CurrentUser].Click(AssignJudgePage.AddStaffMember);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AssignJudgePage.AddStaffEmailTextField).SendKeys("man");
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AssignJudgePage.SearchResults).FindElements(By.TagName("li")).FirstOrDefault().Click();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AssignJudgePage.AddStaffDisplayNameTextField).SendKeys(staffMemberDisplayName);

            var staffUser = new UserDto()
            {
                ContactEmail = "manual.StaffMember_01@hearings.reform.hmcts.net",
                DisplayName = staffMemberDisplayName,
                FirstName = "Manual",
                LastName = "StaffMember_01"
            };

            var staffMember = UserToUserAccountMapper.Map(staffUser);
            staffMember.CaseRoleName = staffMemberRole;
            staffMember.HearingRoleName = staffMemberRole;
            staffMember.Role = staffMemberRole;

            _c.Test.HearingParticipants.Add(staffMember);
        }

        private void SetJudgeEmailAndPhone()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AssignJudgePage.JudgeEmailTextField).SendKeys(Judge.AlternativeEmail);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AssignJudgePage.JudgePhoneTextField).SendKeys(JudgePhone);
        }

        public void EditAudioRecording()
        {
            Thread.Sleep(TimeSpan.FromSeconds(1));
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
