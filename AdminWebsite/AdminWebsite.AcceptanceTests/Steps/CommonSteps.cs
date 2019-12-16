using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class CommonSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly CommonAdminWebPage _commonAdminWebPage;
        public CommonSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, CommonAdminWebPage commonAdminWebPage)
        {
            _c = testContext;
            _browsers = browsers;
            _commonAdminWebPage = commonAdminWebPage;
        }

        [Then(@"they can navigate to the Open Government licence")]
        public void ThenTheyCanNavigateToTheOpenGovernmentLicence()
        {
            _browsers[_c.CurrentUser.Key].ScrollTo(_commonAdminWebPage.OpenGovernmentLicenceLink);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_commonAdminWebPage.OpenGovernmentLicenceLink).Click();
            _browsers[_c.CurrentUser.Key].NavigateBack();
        }

        [Then(@"they can navigate to Contact us")]
        public void ThenTheyCanNavigateToContactUs()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_commonAdminWebPage.ContactUsLink).Click();
            _browsers[_c.CurrentUser.Key].SwitchTab(Page.ContactUs.Url);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_commonAdminWebPage.ContactUsTitle).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_commonAdminWebPage
                .ContactUsPhoneNumber(_c.AdminWebConfig.TestConfig.CommonData.CommonOnScreenData.VhoPhone)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_commonAdminWebPage
                .ContactUsEmail(_c.AdminWebConfig.TestConfig.CommonData.CommonOnScreenData.VhoEmail)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].CloseTab();
        }
    }
}
