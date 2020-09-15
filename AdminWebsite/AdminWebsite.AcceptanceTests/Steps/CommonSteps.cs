using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.TestAPI.Client;
using FluentAssertions;
using Selenium.Axe;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class CommonSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;
        public CommonSteps(TestContext testContext, Dictionary<User, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        [Then(@"they can navigate to the Open Government licence")]
        public void ThenTheyCanNavigateToTheOpenGovernmentLicence()
        {
            _browsers[_c.CurrentUser].ScrollTo(CommonAdminWebPage.OpenGovernmentLicenceLink);
            _browsers[_c.CurrentUser].ClickLink(CommonAdminWebPage.OpenGovernmentLicenceLink);
            _browsers[_c.CurrentUser].NavigateBack();
        }

        [Then(@"they can navigate to Contact us")]
        public void ThenTheyCanNavigateToContactUs()
        {
            _browsers[_c.CurrentUser].ClickLink(CommonAdminWebPage.ContactUsLink);
            _browsers[_c.CurrentUser].SwitchTab(Page.ContactUs.Url);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(CommonAdminWebPage.ContactUsTitle).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(CommonAdminWebPage
                .ContactUsPhoneNumber(_c.Test.CommonData.CommonOnScreenData.VhoPhone)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(CommonAdminWebPage
                .ContactUsEmail(_c.Test.CommonData.CommonOnScreenData.VhoEmail)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].CloseTab();
        }

        [Then(@"the page should be accessible")]
        public void ThenThePageShouldBeAccessible()
        {
            var axeResult = new AxeBuilder(_browsers[_c.CurrentUser].Driver).Analyze();
            axeResult.Violations.Should().BeEmpty();
        }
    }
}
