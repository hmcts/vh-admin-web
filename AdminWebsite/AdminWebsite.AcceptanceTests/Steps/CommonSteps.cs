using AdminWebsite.AcceptanceTests.Pages;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class CommonSteps
    {
        private readonly Common _common;

        public CommonSteps(Common common)
        {
            _common = common;
        }
        [When(@"next button is clicked")]
        public void WhenNextButtonIsClicked()
        {           
            _common.NextButton();
        }
    }
}