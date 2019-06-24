using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;
using System.Linq;
using AdminWebsite.AcceptanceTests.Contexts;
using AdminWebsite.BookingsAPI.Client;

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
        private readonly BookingsApiClient _bookingsApiClient;

        public QuestionnarieList(Questionnaire questionnarieList,
            Dashboard dashboard, LoginSteps loginSteps, TestsContext testsContext
           )
        {
            _questionnarieList = questionnarieList;
            _dashboard = dashboard;
            _loginSteps = loginSteps;
            _testsContext = testsContext;
            // _bookingsApiClient = bookingsApiClient;
        }

        [Given(@"Participants answered questionnaire")]
        public void GivenParticipantsAnsweredQuestionnaire()
        {
            var bookNewHearingRequest = CreateHearingRequest.BuildRequest();
            _testsContext.Request = _testsContext.Post("hearings", bookNewHearingRequest);

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
            _questionnarieList.Particpants().Count().Should().BeGreaterThan(0);
        }

    }
}
