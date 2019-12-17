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
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class HearingDetailsSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly HearingDetailsPage _hearingDetailsPage;
        private readonly CommonSharedSteps _commonSharedSteps;
        private readonly Random _fromRandomNumber;

        public HearingDetailsSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, HearingDetailsPage hearingDetailsPage, CommonSharedSteps commonSharedSteps)
        {
            _fromRandomNumber = new Random();
            _c = testContext;
            _browsers = browsers;
            _hearingDetailsPage = hearingDetailsPage;
            _commonSharedSteps = commonSharedSteps;
        }

        [When(@"the user completes the hearing details form")]
        public void ProgressToNextPage()
        {
            SetHearingDetails();
            SetHearingType();
            SendQuestionnaires();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingDetailsPage.NextButton).Click();
        }

        public void EditHearingDetails()
        {
            SetHearingDetails();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingDetailsPage.NextButton).Click();
        }

        public void SetHearingDetails()
        {
            _c.Test.HearingDetails.CaseNumber = $"{GenerateRandom.CaseNumber(_fromRandomNumber)}";
            _browsers[_c.CurrentUser.Key].Clear(_hearingDetailsPage.CaseNumberTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingDetailsPage.CaseNumberTextfield).SendKeys(_c.Test.HearingDetails.CaseNumber);
            _c.Test.HearingDetails.CaseName = $"Admin Web Automated Test {GenerateRandom.Letters(_fromRandomNumber)}";
            _browsers[_c.CurrentUser.Key].Clear(_hearingDetailsPage.CaseNameTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_hearingDetailsPage.CaseNameTextfield).SendKeys(_c.Test.HearingDetails.CaseName);
        }

        public void SetHearingType(HearingType hearingType = null)
        {
            if (hearingType == null)
                hearingType = HearingType.FromString(_c.AdminWebConfig.TestConfig.TestData.HearingDetails.HearingType);

            _c.Test.HearingDetails.HearingType = hearingType;
            _c.Test.HearingDetails.CaseType = CaseType.FromString(_c.AdminWebConfig.TestConfig.TestData.HearingDetails.CaseType);
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser.Key].Driver, _hearingDetailsPage.HearingTypeDropdown, HearingType.ToString(hearingType));
        }

        public void SendQuestionnaires()
        {
            _c.Test.HearingDetails.DoNotSendQuestionnaires = _c.AdminWebConfig.TestConfig.TestData.HearingDetails.DoNotSendQuestionnaires;

            var isCheckboxSelected = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(_hearingDetailsPage.SendQuestionnairesCheckbox).Selected;
            if (_c.Test.HearingDetails.DoNotSendQuestionnaires)
            {
                if (!isCheckboxSelected)
                {
                    _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(_hearingDetailsPage.SendQuestionnairesCheckbox).Click();
                }
            }
            else
            {
                if (isCheckboxSelected)
                {
                    _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(_hearingDetailsPage.SendQuestionnairesCheckbox).Click();
                }
            }
        }
    }
}
