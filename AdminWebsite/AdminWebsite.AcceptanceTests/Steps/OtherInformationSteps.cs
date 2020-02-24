using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using OpenQA.Selenium;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class OtherInformationSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        public OtherInformationSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        [When(@"the user completes the other information form")]
        public void ProgressToNextPage()
        {
            SetOtherInformation();
            _browsers[_c.CurrentUser.Key].Clear(OtherInformationPage.OtherInformationTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(OtherInformationPage.OtherInformationTextfield).SendKeys(_c.Test.OtherInformation);
            ClickNext();
        }

        private void SetOtherInformation()
        {
            _c.Test.OtherInformation = _c.Test.OtherInformation != null ? "Updated other information" : _c.Test.TestData.OtherInformation.Other;
        }

        public void ClickNext()
        {
            _browsers[_c.CurrentUser.Key].WaitForPageToLoad();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(OtherInformationPage.OtherInformationTextfield).SendKeys(Keys.Tab);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(OtherInformationPage.NextButton);
            _browsers[_c.CurrentUser.Key].Click(OtherInformationPage.NextButton);
        }
    }
}
