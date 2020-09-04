using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.TestAPI.Client;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class QuestionnaireSteps : ISteps
    {
        private const string UnansweredAnswer = "Not answered";
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;
        private ParticipantResponse _participantResponse;
        public QuestionnaireSteps(TestContext testContext, Dictionary<User, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        public void ProgressToNextPage()
        {
            _browsers[_c.CurrentUser].Click(CommonAdminWebPage.DashboardLink);
        }

        [Given(@"there is a hearing where an (.*) participant has completed some questionnaire answers")]
        public void GivenThereIsAHearingWithQuestionnaireAnswers(string role)
        {
            _participantResponse = _c.Test.HearingResponse.Participants.First(x => x.User_role_name.ToLower().Equals(role.ToLower()));
            AddSuitabilityAnswers(_c.Test.HearingResponse.Id, _participantResponse.Id, role.ToLower());
        }

        [Then(@"the user can see a list of answers including the (.*) specific answer")]
        public void ThenTheUserCanSeeAListOfAnswers(string role)
        {
            _browsers[_c.CurrentUser].Click(QuestionnairePage.QuestionnaireLink(_participantResponse.Last_name));
            var allQuestionsAndAnswers = GetQuestionsAndAnswers();
            CheckQuestionHasBeenAnswered(_c.Test.TestData.Questionnaire.SelfTestQuestion1, "Yes", allQuestionsAndAnswers);
            CheckQuestionHasBeenAnswered(_c.Test.TestData.Questionnaire.SelfTestQuestion2, "Yes", allQuestionsAndAnswers);
            CheckQuestionHasBeenAnswered(
                role.ToLower().Equals("individual")
                    ? _c.Test.TestData.Questionnaire.IndividualQuestion
                    : _c.Test.TestData.Questionnaire.RepresentativeQuestion, "Yes", allQuestionsAndAnswers);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(QuestionnairePage.ExtendedAnswer(_c.Test.TestData.Questionnaire.ExtendedAnswer)).Displayed.Should().BeTrue();
            CheckQuestionHasBeenAnswered(_c.Test.TestData.Questionnaire.UnansweredQuestion, UnansweredAnswer, allQuestionsAndAnswers);
        }

        private static void CheckQuestionHasBeenAnswered(string question, string answer, IReadOnlyDictionary<string, string> allQuestionsAndAnswers)
        {
            allQuestionsAndAnswers[question].Should().Be(answer);
        }

        private void AddSuitabilityAnswers(Guid hearingId, Guid participantId, string role)
        {
            var answers = SuitabilityAnswers.Build(role, _c.Test.TestData.Questionnaire.ExtendedAnswer);
            var response = _c.Api.SetSuitabilityAnswers(hearingId, participantId, answers);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        private Dictionary<string, string> GetQuestionsAndAnswers()
        {
            var questions = _browsers[_c.CurrentUser].Driver.WaitUntilElementsVisible(QuestionnairePage.AllQuestions);
            var answers = _browsers[_c.CurrentUser].Driver.WaitUntilElementsVisible(QuestionnairePage.AllAnswers);
            var questionsAndAnswers = new Dictionary<string, string>();

            for (var i = 0; i < questions.Count; i++)
            {
                questionsAndAnswers.Add(questions[i].Text, answers[i].Text);
            }

            return questionsAndAnswers;
        }
    }
}
