using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;
using System.Linq;
using AdminWebsite.AcceptanceTests.Contexts;
using AdminWebsite.BookingsAPI.Client;
using Testing.Common;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class QuestionnarieList
    {
        private readonly string CaseNumberKey = "HEARING_CASE_NUMBER";
        private readonly Questionnaire _questionnarieList;
        private readonly Dashboard _dashboard;
        private readonly LoginSteps _loginSteps;
        private readonly TestsContext _testsContext;
        private readonly ScenarioContext _scenarioContext;

        public QuestionnarieList(Questionnaire questionnarieList,
            Dashboard dashboard, LoginSteps loginSteps, TestsContext testsContext,
            ScenarioContext scenarioContext)
        {
            _questionnarieList = questionnarieList;
            _dashboard = dashboard;
            _loginSteps = loginSteps;
            _testsContext = testsContext;
            _scenarioContext = scenarioContext;
        }

        [Given(@"Participants answered questionnaire")]
        public void GivenParticipantsAnsweredQuestionnaire()
        {
            var bookNewHearingRequest = CreateHearingRequest.BuildRequest();
            _testsContext.Request = _testsContext.Post("hearings", bookNewHearingRequest);
            var response = _testsContext.Execute();
            var hearing = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(response.Content);
            var hearingId = hearing.Id.ToString();
            var participantId = hearing.Participants[0].Id.ToString();
            _scenarioContext.Add(CaseNumberKey, hearing.Cases[0].Number);

            var answers = CreateHearingRequest.BuildSuitabilityAnswerRequest();
            _testsContext.Request = _testsContext.Put($"hearings/{hearingId}/participants/{participantId}/suitability-answers", answers);
            var responseAnswer = _testsContext.Execute();
        }

        [Given(@"VH Officer on dashboard page")]
        public void GivenVHOfficerOnDashboardPage()
        {
            _loginSteps.UserLogsInWithValidCredentials("VH Officer");
            _dashboard.PageUrl(PageUri.DashboardPage);
        }

        [When(@"VH Officer press questionnaire")]
        public void WhenVHOfficerPressQuestionnaire()
        {
            _dashboard.QuestionnaireResultPanel();
        }

        [Then(@"Expected questionnaire with answers should be populated")]
        public void ThenExpectedQuestionnaireWithAnswersShouldBePopulated()
        {
            var caseNumber = _scenarioContext[CaseNumberKey].ToString();
            _questionnarieList.Particpants().Count().Should().BeGreaterThan(0);

            var element = _questionnarieList.Particpants().FirstOrDefault(x => x.Text.Contains(caseNumber));
            element.Should().NotBeNull();

            element.Click();
            _questionnarieList.Answers().Where(x => x == "Yes").Count().Should().Be(2);
        }
    }
}
