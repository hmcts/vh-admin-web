using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;
using System.Collections.Generic;
using System.Linq;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class Dashboard : Common
    {
        private readonly Browser _browser;

        public Dashboard(Browser browser) : base(browser)
        {
            _browser = browser;
        }

        private static By Title => By.XPath("//*[@class='vhpanel-title']");
        private static By BookHearingPanelButton => By.XPath("//*[@id='vhpanel-green']/h1");
        private static By QuestionnaireResultPanelButton => By.XPath("//*[@id='vhpanel-blue']/h1");
        private static By UnauthorisedErrorText => By.XPath("//*[@class='govuk-heading-xl']");

        public List<string> VhPanelTitle()
        {
            return _browser.NgDriver.WaitUntilElementsVisible(Title).Select(panel => panel.Text).ToList();
        }

        public string UnauthorisedText() => _browser.NgDriver.WaitUntilElementVisible(UnauthorisedErrorText).Text.Trim();
        public void BookHearingPanel() => ClickElement(BookHearingPanelButton);
        public void QuestionnaireResultPanel() => ClickElement(QuestionnaireResultPanelButton);
    }
}