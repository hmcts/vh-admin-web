using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using System.Linq;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingDetailsSteps
    {
        private readonly HearingDetails _hearingDetails;
        private readonly ScenarioContext _scenarioContext;

        public HearingDetailsSteps(HearingDetails hearingDetails, ScenarioContext injectedContext)
        {
            _hearingDetails = hearingDetails;
            _scenarioContext = injectedContext;
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
        [Then(@"case type dropdown should be populated")]
        [Then(@"case type dropdown should not be populated")]
        public void ThenCaseTypeDropdownShouldNotBePopulated()
        {
            switch (_scenarioContext.Get<string>("User"))
            {
                case "CaseAdminFinRemedyCivilMoneyClaims":
                    _hearingDetails.CaseTypesList().ToList().Count.Should().Be(2);
                    break;
                case "Case Admin":
                    _hearingDetails.CaseTypesList().Should().BeEmpty();
                    break;
            }
        }
        [When(@"hearing booking detail is updated")]
        public void WhenHearingBookingDetailIsUpdated()
        {
            HearingDetailsPage();
            InputCaseNumber(TestData.HearingDetails.CaseNumber);
            SelectHearingType();
            InputCaseName(TestData.HearingDetails.CaseName);            
        }
        [Given(@"user selects hearing type as (.*)")]
        public void GivenUserSelectsHearingTypeAsCivilMoneyClaims(string hearingType)
        {
            WhenHearingBookingDetailIsUpdated();
            _hearingDetails.CaseTypes(hearingType);
        }
    }
}