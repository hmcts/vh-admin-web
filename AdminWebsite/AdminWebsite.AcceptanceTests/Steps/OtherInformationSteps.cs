using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class OtherInformationSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly OtherInformationPage _otherInformationPage;
        public OtherInformationSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, OtherInformationPage otherInformationPage)
        {
            _c = testContext;
            _browsers = browsers;
            _otherInformationPage = otherInformationPage;
        }

        [When(@"the user completes the other information form")]
        public void ProgressToNextPage()
        {
            SetOtherInformation();
            _browsers[_c.CurrentUser.Key].Clear(_otherInformationPage.OtherInformationTextfield);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_otherInformationPage.OtherInformationTextfield).SendKeys(_c.Test.OtherInformation);
            ClickNext();
        }

        private void SetOtherInformation()
        {
            _c.Test.OtherInformation = _c.Test.OtherInformation != null ? "Updated other information" : _c.AdminWebConfig.TestConfig.TestData.OtherInformation.Other;
        }

        public void ClickNext()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_otherInformationPage.NextButton).Click();
        }
    }
}
