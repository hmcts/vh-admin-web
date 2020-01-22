using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class QuestionnairePage
    {
        public By QuestionnaireLink(string name) => By.XPath($"//span[contains(text(),'{name}')]/parent::a");
        public By AllQuestions = By.XPath("//*[@class='govuk-body vh-date vh-wrap vh-mr15']/../../div/span[@class='govuk-body vh-table-row']");
        public By AllAnswers = By.XPath("//*[@class='govuk-body vh-date vh-wrap vh-mr15']");
        public By ExtendedAnswer(string extendedAnswer) => CommonLocators.ElementContainingText(extendedAnswer);
    }
}
