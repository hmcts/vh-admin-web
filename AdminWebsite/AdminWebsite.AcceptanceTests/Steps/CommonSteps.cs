using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using TestApi.Contract.Dtos;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class CommonSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        public CommonSteps(TestContext testContext, Dictionary<UserDto, UserBrowser> browsers)
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
    }
}
