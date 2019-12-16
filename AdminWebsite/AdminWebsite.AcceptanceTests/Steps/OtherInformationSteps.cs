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
            var otherInformation = _c.AdminWebConfig.TestConfig.TestData.OtherInformation.Other;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_otherInformationPage.OtherInformationTextfield).SendKeys(otherInformation);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_otherInformationPage.NextButton).Click();
        }
    }
}
