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
            var axeResult = new AxeBuilder(_browsers[_c.CurrentUser.Key].Driver)
                .DisableRules( // BUG: Once VIH-5174 bug is fixed, remove these exclusions
                    "region", // https://dequeuniversity.com/rules/axe/3.3/region?application=axeAPI
                    "landmark-main-is-top-level", // https://dequeuniversity.com/rules/axe/3.3/landmark-main-is-top-level?application=axeAPI
                    "landmark-one-main", // https://dequeuniversity.com/rules/axe/3.3/landmark-one-main?application=axeAPI
                    "landmark-no-duplicate-banner", // https://dequeuniversity.com/rules/axe/3.3/landmark-no-duplicate-banner?application=axeAPI
                    "landmark-no-duplicate-contentinfo", // https://dequeuniversity.com/rules/axe/3.3/landmark-no-duplicate-contentinfo?application=axeAPI
                    "page-has-heading-one", // https://dequeuniversity.com/rules/axe/3.3/page-has-heading-one?application=axeAPI
                    "landmark-unique") // https://dequeuniversity.com/rules/axe/3.3/landmark-unique?application=axeAPI
                .Analyze();
            axeResult.Violations.Should().BeEmpty();
        }
    }
}
