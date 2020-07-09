using AdminWebsite.AcceptanceTests.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class TestHelperSteps
    {
        private readonly TestContext _c;
        private readonly QuestionnaireSteps _questionnaireSteps;

        public TestHelperSteps(TestContext testContext, QuestionnaireSteps questionnaireSteps)
        {
            _c = testContext;
            _questionnaireSteps = questionnaireSteps;
        }

        [Given(@"I have (.*) hearings with questionnaire results")]
        public void GivenIHaveHearingsWithQuestionnaireResults(int hearingsCount)
        {
            hearingsCount.Should().BeInRange(1, 300);
            for (var i = 0; i < hearingsCount; i++)
            {
                _questionnaireSteps.GivenThereIsAHearingWithQuestionnaireAnswers("Individual");
            }
        }
    }
}
