using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;
using System.Collections.Generic;
using System.Linq;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class Questionnaire : Common
    {
        private readonly Browser _browser;
        private readonly By _questionnaireList = By.Id("vh-table");

        public Questionnaire(Browser browser) : base(browser)
        {
            _browser = browser;
        }

        public List<IWebElement> Participants()
        {
            return GetListOfElements(By.CssSelector("span.vh-ml15")).ToList();
        }

        public IList<string> Answers()
        {
            var answerElements = GetListOfElements(By.XPath("//*[@class='govuk-body vh-date vh-wrap vh-mr15']"));
            return answerElements.Select(x => x.Text).ToList();
        }
    }
}
