using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using System;
using System.Linq;
using AdminWebsite.AcceptanceTests.Contexts;
using TechTalk.SpecFlow;
using AdminWebsite.AcceptanceTests.Configuration;

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
            SelectQuestionnaireNotRequired();
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

        [When(@"Select room")]
        public void SelectRoom()
        {
            _hearingDetails.HearingType();
        }

        [When(@"Select questionnaire not required")]
        public void SelectQuestionnaireNotRequired()
        {
            _hearingDetails.QuestionnaireNotRequired();
        }

        [Then(@"case type dropdown should be populated")]
        [Then(@"case type dropdown should not be populated")]
        public void ThenCaseTypeDropdownShouldNotBePopulated()
        {
            var caseTypes = _hearingDetails.CaseTypesList();
            Console.WriteLine($"Case Types List: {caseTypes}");

            switch (_context.CurrentUser.Role.ToLower())
            {
                case "vh officer":
                case "video hearings officer":
                    caseTypes.ToList().Count.Should().Be(_context.CurrentUser.UserGroups.Count);
                    break;
                case "case admin":
                    if (_context.CurrentUser.UserGroups.Count <= 1)
                        caseTypes.Should().BeEmpty();
                    else
                    {
                        caseTypes.ToList().Count.Should().Be(_context.CurrentUser.UserGroups.Count);
                    }
                    break;
                default: throw new ArgumentOutOfRangeException($"User role {_context.CurrentUser.Role} not defined");
            }
        }


        [Then(@"I see the case type dropdown on this page")]
        [Then(@"I do not see the case type dropdown on this page")]
        public void ThenCaseTypeDropdownVisible()
        {
            var caseTypes = _hearingDetails.CaseTypesList();
            Console.WriteLine($"Case Types List: {caseTypes}");

            switch (_context.CurrentUser.Role.ToLower())
            {
                case "vh officer":
                case "video hearings officer":
                    caseTypes.ToList().Count.Should().Be(_context.CurrentUser.UserGroups.Count);
                    break;
                case "case admin":
                    if (_context.CurrentUser.UserGroups.Count <= 1)
                        caseTypes.Should().BeEmpty();
                    else
                    {
                        caseTypes.ToList().Count.Should().Be(_context.CurrentUser.UserGroups.Count);
                    }
                    break;
                default: throw new ArgumentOutOfRangeException($"User role {_context.CurrentUser.Role} not defined");
            }
        }



        [When(@"hearing booking detail is updated")]
        public void WhenHearingBookingDetailIsUpdated()
        {
            HearingDetailsPage();
            _context.TestData.HearingData.Update(_context.TestData.HearingData.CaseNumber);
            InputCaseNumber(_context.TestData.HearingData.CaseNumber);
            SelectHearingType();
            _context.TestData.HearingData.Update(_context.TestData.HearingData.CaseName);
            InputCaseName(_context.TestData.HearingData.CaseName);
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
            _context.TestData.HearingData.Update(_context.TestData.HearingData.CaseNumber);
            InputCaseNumber(_context.TestData.HearingData.CaseNumber);
            _context.TestData.HearingData.Update(_context.TestData.HearingData.CaseName);
            InputCaseName(_context.TestData.HearingData.CaseName);
            switch (user)
            {
                case "Case Admin":
                    _hearingDetails.DisabledFields().Should().Be(1);
                    break;
                case "CaseAdminFinRemedyCivilMoneyClaims":
                    _hearingDetails.DisabledFields().Should().Be(2);
                    break;
                default: throw new ArgumentOutOfRangeException($"User '{user}' is not defined");
            }
        }

        [Then(@"I see all associated case types in the case type dropdown")]
        [Then(@"I see all case types in the case type dropdown")]
        public void ThenIseeCaseTypesInTheCaseTypeDropdown()
        {
            foreach (var group in _context.CurrentUser.UserGroups)
            {
                _hearingDetails.CaseTypesList().Should().Contain(group.ToString());
            }
        }
    }
}