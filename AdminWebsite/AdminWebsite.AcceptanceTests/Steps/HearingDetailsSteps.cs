using System;
using System.Collections.Generic;
using System.Threading;
using AcceptanceTests.Common.Data.Helpers;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Model.Case;
using AcceptanceTests.Common.Model.Hearing;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using TestApi.Contract.Dtos;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class HearingDetailsSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly CommonSharedSteps _commonSharedSteps;
        private readonly Random _fromRandomNumber;

        public HearingDetailsSteps(TestContext testContext, Dictionary<UserDto, UserBrowser> browsers, CommonSharedSteps commonSharedSteps)
        {
            _fromRandomNumber = new Random();
            _c = testContext;
            _browsers = browsers;
            _commonSharedSteps = commonSharedSteps;
        }

        [When(@"the user completes the hearing details form")]
        public void ProgressToNextPage()
        {
            SetHearingDetails();
            SetCaseType();
            SetHearingType();
            _c.Test.HearingDetails.DoNotSendQuestionnaires = _c.Test.TestData.HearingDetails.DoNotSendQuestionnaires;
            _browsers[_c.CurrentUser].Click(HearingDetailsPage.NextButton);
        }

        [When(@"the user elects to send the questionnaires")]
        public void WhenTheUserSelectsToSendTheQuestionnaires()
        {
            SetHearingDetails();
            SetCaseType();
            SetHearingType();
            _c.Test.HearingDetails.DoNotSendQuestionnaires = false;
            _browsers[_c.CurrentUser].Click(HearingDetailsPage.NextButton);
        }

        public void EditHearingDetails()
        {
            Thread.Sleep(TimeSpan.FromSeconds(1));
            SetHearingDetails();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingDetailsPage.NextButton);
            _browsers[_c.CurrentUser].Click(HearingDetailsPage.NextButton);
            Thread.Sleep(TimeSpan.FromSeconds(1));
        }

        public void SetHearingDetails()
        {
            _c.Test.HearingDetails.CaseNumber = $"{GenerateRandom.CaseNumber(_fromRandomNumber)}";
            _browsers[_c.CurrentUser].Clear(HearingDetailsPage.CaseNumberTextfield);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingDetailsPage.CaseNumberTextfield).SendKeys(_c.Test.HearingDetails.CaseNumber);
            _browsers[_c.CurrentUser].Driver.WaitUntilTextPresent(HearingDetailsPage.CaseNumberTextfield, _c.Test.HearingDetails.CaseNumber);
            _c.Test.HearingDetails.CaseName = $"Admin Web Automated Test {GenerateRandom.Letters(_fromRandomNumber)}";
            _browsers[_c.CurrentUser].Clear(HearingDetailsPage.CaseNameTextfield);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingDetailsPage.CaseNameTextfield).SendKeys(_c.Test.HearingDetails.CaseName);
            _browsers[_c.CurrentUser].Driver.WaitUntilTextPresent(HearingDetailsPage.CaseNameTextfield, _c.Test.HearingDetails.CaseName);
        }

        public void SetCaseType(CaseType caseType = null)
        {
            caseType ??= CaseType.FromString(_c.Test.TestData.HearingDetails.CaseType);

            _c.Test.HearingDetails.CaseType = CaseType.FromString(_c.Test.TestData.HearingDetails.CaseType);
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver, HearingDetailsPage.CaseTypeDropdown, CaseType.ToString(caseType));
        }

        public void SetHearingType(HearingType hearingType = null)
        {
            hearingType ??= HearingType.FromString(_c.Test.TestData.HearingDetails.HearingType);

            _c.Test.HearingDetails.HearingType = hearingType;
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver, HearingDetailsPage.HearingTypeDropdown, HearingType.ToString(hearingType));
        } 
    }
}
