using System;
using System.Collections.Generic;
using AcceptanceTests.Common.Data.Helpers;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Model.Case;
using AcceptanceTests.Common.Model.Hearing;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using OpenQA.Selenium;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class HearingDetailsSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly CommonSharedSteps _commonSharedSteps;
        private readonly Random _fromRandomNumber;

        public HearingDetailsSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, CommonSharedSteps commonSharedSteps)
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
            SetHearingType();
            _c.Test.HearingDetails.DoNotSendQuestionnaires = _c.Test.TestData.HearingDetails.DoNotSendQuestionnaires;
            SendQuestionnaires();
            _browsers[_c.CurrentUser.Key].Click(HearingDetailsPage.NextButton);
        }

        [When(@"the user elects to send the questionnaires")]
        public void WhenTheUserSelectsToSendTheQuestionnaires()
        {
            SetHearingDetails();
            SetHearingType();
            _c.Test.HearingDetails.DoNotSendQuestionnaires = false;
            SendQuestionnaires();
            _browsers[_c.CurrentUser.Key].Click(HearingDetailsPage.NextButton);
        }

        public void EditHearingDetails()
        {
            SetHearingDetails();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingDetailsPage.NextButton);
            _browsers[_c.CurrentUser.Key].Click(HearingDetailsPage.NextButton);
        }

        public void SetHearingDetails()
        {
            _c.Test.HearingDetails.CaseNumber = $"{GenerateRandom.CaseNumber(_fromRandomNumber)}";
            _browsers[_c.CurrentUser.Key].Clear(HearingDetailsPage.CaseNumberTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingDetailsPage.CaseNumberTextfield).SendKeys(_c.Test.HearingDetails.CaseNumber);
            _c.Test.HearingDetails.CaseName = $"Admin Web Automated Test {GenerateRandom.Letters(_fromRandomNumber)}";
            _browsers[_c.CurrentUser.Key].Clear(HearingDetailsPage.CaseNameTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingDetailsPage.CaseNameTextfield).SendKeys(_c.Test.HearingDetails.CaseName);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingDetailsPage.CaseNameTextfield).SendKeys(Keys.Tab);
        }

        public void SetHearingType(HearingType hearingType = null)
        {
            if (hearingType == null)
                hearingType = HearingType.FromString(_c.Test.TestData.HearingDetails.HearingType);

            _c.Test.HearingDetails.HearingType = hearingType;
            _c.Test.HearingDetails.CaseType = CaseType.FromString(_c.Test.TestData.HearingDetails.CaseType);
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser.Key].Driver, HearingDetailsPage.HearingTypeDropdown, HearingType.ToString(hearingType));
        }

        public void SendQuestionnaires()
        {
            var isCheckboxSelected = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(HearingDetailsPage.SendQuestionnairesCheckbox).Selected;
            if (_c.Test.HearingDetails.DoNotSendQuestionnaires)
            {
                if (!isCheckboxSelected)
                    _browsers[_c.CurrentUser.Key].ClickCheckbox(HearingDetailsPage.SendQuestionnairesCheckbox);
            }
            else
            {
                if (isCheckboxSelected)
                    _browsers[_c.CurrentUser.Key].ClickCheckbox(HearingDetailsPage.SendQuestionnairesCheckbox);
            }
        }
    }
}
