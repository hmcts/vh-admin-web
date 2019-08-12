using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using System;
using System.Linq;
using AdminWebsite.AcceptanceTests.Contexts;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingDetailsSteps
    {
        private readonly TestContext _context;
        private readonly HearingDetails _hearingDetails;
        private readonly ScenarioContext _scenarioContext;

        public HearingDetailsSteps(TestContext context, HearingDetails hearingDetails, ScenarioContext injectedContext)
        {
            _context = context;
            _hearingDetails = hearingDetails;
            _scenarioContext = injectedContext;
        }

        [When(@"hearing details form is filled")]
        public void WhenHearingDetailsFormIsFilled()
        {
            HearingDetailsPage();
            _hearingDetails.AddItems("CaseNumber", _context.TestData.HearingData.CaseNumber);
            InputCaseNumber(_context.TestData.HearingData.CaseNumber);
            InputCaseName(_context.TestData.HearingData.CaseName);
            if (UserHasMoreThanOneCaseTypeGroup())
            {
                SelectCaseType();
            }
            SelectHearingType();
        }

        private bool UserHasMoreThanOneCaseTypeGroup()
        {
            return _context.CurrentUser.Username.Contains("CMC") &&
                   _context.CurrentUser.Username.Contains("FR");
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
                default: throw new ArgumentOutOfRangeException($"User {_scenarioContext.Get<string>("User")} not defined");
            }
        }

        [When(@"hearing booking detail is updated")]
        public void WhenHearingBookingDetailIsUpdated()
        {
            HearingDetailsPage();
            InputCaseNumber(_context.TestData.HearingData.UpdatedCaseNumber);
            SelectHearingType();
            InputCaseName(_context.TestData.HearingData.UpdatedCaseName);            
        }

        [Given(@"user selects (.*)")]
        public void GivenUserSelectsCaseTypeAsCivilMoneyClaims(string caseType)
        {
            _hearingDetails.AddItems("CaseTypes", caseType);
            InputCaseNumber(_context.TestData.HearingData.CaseNumber);
            InputCaseName(_context.TestData.HearingData.CaseName);
            _hearingDetails.CaseTypes(caseType);
            _hearingDetails.HearingType();
            _hearingDetails.ClickNextButton();
        }

        [Then(@"disabled mandatory fields should be (.*)")]
        public void ThenDisabledMandatoryFieldsShouldBeListed(int field)
        {
            _hearingDetails.DisabledFields().Should().Be(field);
        }

        [When(@"(.*) updates hearing booking details")]
        public void WhenCaseAdminUpdatesHearingBookingDetails(string user)
        {
            InputCaseNumber(_context.TestData.HearingData.UpdatedCaseNumber);
            InputCaseName(_context.TestData.HearingData.UpdatedCaseName);
            switch (user)
            {
                case "Case Admin": _hearingDetails.DisabledFields().Should().Be(1);
                    break;
                case "CaseAdminFinRemedyCivilMoneyClaims": _hearingDetails.DisabledFields().Should().Be(2);
                    break;
                default: throw new ArgumentOutOfRangeException($"User '{user}' is not defined");
            }
        }
    }
}