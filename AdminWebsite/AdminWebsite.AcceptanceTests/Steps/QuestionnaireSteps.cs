using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Requests;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.BookingsAPI.Client;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class QuestionnaireSteps : ISteps
    {
        private const string UnansweredQuestion = "Will you need an interpreter for your hearing?";
        private const string UnansweredAnswer = "Not answered";
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly QuestionnairePage _questionnairePage;
        private readonly CommonAdminWebPage _commonAdminWebPage;
        private BookingsApiManager _bookingsApiManager;
        private ParticipantResponse _participantResponse;
        public QuestionnaireSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, CommonAdminWebPage commonAdminWebPage, QuestionnairePage questionnairePage)
        {
            _c = testContext;
            _browsers = browsers;
            _commonAdminWebPage = commonAdminWebPage;
            _questionnairePage = questionnairePage;
        }

        public void ProgressToNextPage()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_commonAdminWebPage.DashboardLink).Click();
        }

        [Given(@"there is a hearing where participants have completed some questionnaire answers")]
        public void GivenThereIsAHearingWhereParticipantsHaveCompletedSomeQuestionnaireAnswers()
        {
            var hearing = CreateHearing();
            _participantResponse = hearing.Participants.First(x => x.User_role_name.ToLower().Equals("individual"));
            AddSuitabilityAnswers(hearing.Id, _participantResponse.Id);
        }

        [Then(@"the user can see a list of answers")]
        public void ThenTheUserCanSeeAListOfAnswers()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_questionnairePage.QuestionnaireLink(_participantResponse.Last_name)).Click();
            var allQuestionsAndAnswers = GetQuestionsAndAnswers();
            CheckQuestionHasBeenAnswered(_c.AdminWebConfig.TestConfig.TestData.Questionnaire.Question1, "Yes", allQuestionsAndAnswers);
            CheckQuestionHasBeenAnswered(_c.AdminWebConfig.TestConfig.TestData.Questionnaire.Question2, "Yes", allQuestionsAndAnswers);
            CheckQuestionHasBeenAnswered(UnansweredQuestion, UnansweredAnswer, allQuestionsAndAnswers);
        }

        private void CheckQuestionHasBeenAnswered(string question, string answer, Dictionary<string, string> allQuestionsAndAnswers)
        {
            allQuestionsAndAnswers[question].Should().Be(answer);
        }

        private HearingDetailsResponse CreateHearing()
        {
            var hearingRequest = new HearingRequestBuilder()
                .WithUserAccounts(_c.AdminWebConfig.UserAccounts)
                .Build();

            _bookingsApiManager = new BookingsApiManager(_c.AdminWebConfig.VhServices.BookingsApiUrl, _c.Tokens.BookingsApiBearerToken);
            var hearingResponse = _bookingsApiManager.CreateHearing(hearingRequest);
            var hearing = RequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(hearingResponse.Content);
            hearing.Should().NotBeNull();
            return hearing;
        }

        private void AddSuitabilityAnswers(Guid? hearingId, Guid? participantId)
        {
            var answers = SuitabilityAnswers.Build();
            _bookingsApiManager.SetSuitabilityAnswers(hearingId, participantId, answers);
        }

        private Dictionary<string, string> GetQuestionsAndAnswers()
        {
            var questions = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(_questionnairePage.AllQuestions);
            var answers = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(_questionnairePage.AllAnswers);
            var questionsAndAnswers = new Dictionary<string, string>();

            for (var i = 0; i < questions.Count; i++)
            {
                questionsAndAnswers.Add(questions[i].Text, answers[i].Text);
            }

            return questionsAndAnswers;
        }
    }
}
