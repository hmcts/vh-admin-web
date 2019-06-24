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
    public class SuitabilityAnswerEndpoints
    {
        private string ApiRoot => "suitability-answers";
        public string GetSuitabilityAnswers(string cursor) => $"{ApiRoot}/{cursor}";
        public string GetSuitabilityAnswerWithLimit(string cursor = "", int limit = 100) => $"{ApiRoot}/?cursor={cursor}&limit={limit}";
    }

    [Binding]
    public class QuestionnarieList
    {
        private string url = $"suitability-answers/";
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
            var response = _testsContext.Client().Execute(_testsContext.Request);
            var hearing = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(response.Content);
            var hearingId = hearing.Id.ToString();
            var participantId = hearing.Participants[0].Id.ToString();
            _scenarioContext.Add("HEARING_CASE_NUMBER", hearing.Cases[0].Number);
            _testsContext.Answers = CreateHearingRequest.BuildSuitabilityAnswerRequest();
            _testsContext.Request = _testsContext.Put($"hearings/{hearingId}/participants/{participantId}/suitability-answers", _testsContext.Answers);
            var responseAnswer = _testsContext.Client().Execute(_testsContext.Request);
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
            var caseNumber = _scenarioContext["HEARING_CASE_NUMBER"].ToString();
            _questionnarieList.Particpants().Count().Should().BeGreaterThan(0);

            var element = _questionnarieList.Particpants().FirstOrDefault(x => x.Text.Contains(caseNumber));
            element.Should().NotBeNull();
        }
    }
}
