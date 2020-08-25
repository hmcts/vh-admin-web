using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using System.Collections.Generic;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class VideoAccessPointsSteps : ISteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly CommonSharedSteps _commonSharedSteps;
        public VideoAccessPointsSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, CommonSharedSteps commonSharedSteps)
        {
            _c = testContext;
            _browsers = browsers;
            _commonSharedSteps = commonSharedSteps;
        }

        [When(@"the user completes the Video access points form")]
        public void ProgressToNextPage()
        {
            _browsers[_c.CurrentUser.Key].WaitForPageToLoad();
            SetVideoAccessPoint();
            _browsers[_c.CurrentUser.Key].Clear(VideoAccessPointsPage.DisplayNameField(0));
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VideoAccessPointsPage.DisplayNameField(0)).SendKeys(_c.Test.VideoAccessPoints.DisplayName);
            ClickNext();
        }

        private void SetVideoAccessPoint()
        {
            _c.Test.VideoAccessPoints.DisplayName = _c.Test.VideoAccessPoints.DisplayName != null ? "Test Endpoint 001" : _c.Test.TestData.VideoAccessPoints.DisplayName;
        }

        public void ClickNext()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AssignJudgePage.NextButton);
            _browsers[_c.CurrentUser.Key].Click(AssignJudgePage.NextButton);
        }
    }
}
