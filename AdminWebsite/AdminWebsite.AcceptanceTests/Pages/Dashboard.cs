using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;
using System.Collections.Generic;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class Dashboard
    {
        private readonly BrowserContext _browserContext;
        public Dashboard(BrowserContext browserContext)
        {
            _browserContext = browserContext;
        }

        private By _vhPanelTitle => By.XPath("//*[@class='vhpanel-title']");
        private By _bookHearingPanel => By.XPath("//div[@id='vhpanel-green']/h1");
        private By _questionnaireResultPanel => By.XPath("//div[@id='vhpanel-blue']/h1");
        private By _unauthorisedText => By.XPath("//*[@class='govuk-heading-xl']");

        public List<string> VhPanelTitle()
        {
            var panelTitles = new List<string>();
            foreach (var panel in _browserContext.NgDriver.WaitUntilElementsVisible(_vhPanelTitle))
                panelTitles.Add(panel.Text);
            return panelTitles;
        }
        public string UnauthorisedText() => _browserContext.NgDriver.WaitUntilElementVisible(_unauthorisedText).Text.Trim();
    }
}