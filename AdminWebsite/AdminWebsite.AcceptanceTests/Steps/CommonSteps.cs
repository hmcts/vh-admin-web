using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using Selenium.Axe;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class CommonSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        public CommonSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        [Then(@"they can navigate to the Open Government licence")]
        public void ThenTheyCanNavigateToTheOpenGovernmentLicence()
        {
            _browsers[_c.CurrentUser.Key].ScrollTo(CommonAdminWebPage.OpenGovernmentLicenceLink);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonAdminWebPage.OpenGovernmentLicenceLink).Click();
            _browsers[_c.CurrentUser.Key].NavigateBack();
        }

        [Then(@"they can navigate to Contact us")]
        public void ThenTheyCanNavigateToContactUs()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonAdminWebPage.ContactUsLink).Click();
            _browsers[_c.CurrentUser.Key].SwitchTab(Page.ContactUs.Url);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonAdminWebPage.ContactUsTitle).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonAdminWebPage
                .ContactUsPhoneNumber(_c.Test.CommonData.CommonOnScreenData.VhoPhone)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonAdminWebPage
                .ContactUsEmail(_c.Test.CommonData.CommonOnScreenData.VhoEmail)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].CloseTab();
        }

        [Then(@"the page should be accessible")]
        public void ThenThePageShouldBeAccessible()
        {
            var axeResult = new AxeBuilder(_browsers[_c.CurrentUser.Key].Driver).Analyze();
            axeResult.Violations.Should().BeEmpty();
        }
    }
}
