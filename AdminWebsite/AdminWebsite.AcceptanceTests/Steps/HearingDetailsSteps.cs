using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingDetailsSteps
    {
        private readonly HearingDetails _hearingDetails;

        public HearingDetailsSteps(HearingDetails hearingDetails)
        {
            _hearingDetails = hearingDetails;
        }
        [When(@"hearing details form is filled")]
        public void WhenHearingDetailsFormIsFilled()
        {
            HearingDetailsPage();
            InputCaseNumber();
            SelectHearingType();
            InputCaseName();
        }

        [When(@"Admin user is on hearing details page")]
        public void HearingDetailsPage()
        {
            _hearingDetails.PageUrl(PageUri.HearingDetailsPage);
        }
        [When(@"Input case number")]
        public void InputCaseNumber(string caseNumber = "12345")
        {
            _hearingDetails.CaseNumber(caseNumber);
        }
        [When(@"Input case name")]
        public void InputCaseName(string caseName = "12345_12345")
        {
            _hearingDetails.CaseName(caseName);
        }
        [When(@"Select case type")]
        public void SelectCaseType()
        {           
            _hearingDetails.CaseTypes();
        }
        [When(@"Select hearing type")]
        public void SelectHearingType()
        {
            _hearingDetails.HearingType();
        }
        [When(@"Select hearing channel")]
        public void SelectHearingChannel()
        {
            _hearingDetails.HearingChannel();
        }
    }
}