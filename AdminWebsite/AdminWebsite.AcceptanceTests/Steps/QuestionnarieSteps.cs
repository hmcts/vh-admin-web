using System;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;
using System.Linq;
using AdminWebsite.AcceptanceTests.Contexts;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class QuestionnarieList
    {
        private const string CaseNumberKey = "HEARING_CASE_NUMBER";
        private readonly Questionnaire _questionnarieList;
        private readonly Dashboard _dashboard;
        private readonly LoginSteps _loginSteps;
        private readonly CommonSteps _commonSteps;
        private readonly TestContext _context;
        private readonly ScenarioContext _scenarioContext;

        public QuestionnarieList(Questionnaire questionnarieList,
            Dashboard dashboard, LoginSteps loginSteps, CommonSteps commonSteps, 
            TestContext context, ScenarioContext scenarioContext)
        {
            _questionnarieList = questionnarieList;
            _dashboard = dashboard;
            _loginSteps = loginSteps;
            _commonSteps = commonSteps;
            _context = context;
            _scenarioContext = scenarioContext;
        }

        [Given(@"Participants answered questionnaire")]
        public void GivenParticipantsAnsweredQuestionnaire()
        {
            _commonSteps.GivenIHaveAHearing();

            if(_context.Hearing.Participants.Count.Equals(0))
                throw new DataMisalignedException("Participants must be set");

            var participant = _context.Hearing.Participants.First();

            if (participant.Id == null)
                throw new DataMisalignedException("Participant Id must be set");

            _scenarioContext.Add(CaseNumberKey, _context.Hearing.Cases.First().Number);

            var answers = SuitabilityAnswers.Build();
            var endpoint = new BookingsApiUriFactory().BookingsParticipantsEndpoints
                .SuitabilityAnswers(_context.HearingId, (Guid)participant.Id);
            _context.Request = _context.Put(endpoint, answers);
        }

        [Given(@"VH Officer on dashboard page")]
        public void GivenVhOfficerOnDashboardPage()
        {
            _loginSteps.UserLogsInWithValidCredentials("VH Officer");
            _dashboard.PageUrl(PageUri.DashboardPage);
        }

        [When(@"VH Officer press questionnaire")]
        public void WhenVhOfficerPressQuestionnaire()
        {
            _dashboard.QuestionnaireResultPanel();
        }

        [Then(@"Expected questionnaire with answers should be populated")]
        public void ThenExpectedQuestionnaireWithAnswersShouldBePopulated()
        {
            var caseNumber = _scenarioContext[CaseNumberKey].ToString();
            _questionnarieList.Participants().Count.Should().BeGreaterThan(0);

            var element = _questionnarieList.Participants().FirstOrDefault(x => x.Text.Contains(caseNumber));

            if (element == null)
                throw new DataMisalignedException("Participant questionnaire results not found");

            element.Click();
            _questionnarieList.Answers().Count(x => x == "Yes").Should().Be(2);
        }
    }
}
