using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class SummarySteps
    {
        private readonly Summary _summary;
        public SummarySteps(Summary summary)
        {
            _summary = summary;
        }
        [Then(@"hearing summary is displayed on summary page")]
        public void ThenHearingSummaryIsDisplayedOnSummaryPage()
        {
            _summary.ClickBreadcrumb("Summary");
            SummaryPage();
        }
        [Then(@"user should be on summary page")]
        [When(@"Admin user is on summary page")]
        public void SummaryPage()
        {
            _summary.PageUrl(PageUri.SummaryPage);
        }
    }
}