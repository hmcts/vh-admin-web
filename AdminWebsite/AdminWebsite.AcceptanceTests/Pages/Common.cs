using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;
using System.Collections.Generic;
using FluentAssertions;
using System.Linq;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class Common
    {
        private readonly BrowserContext _browserContext;
        public Common(BrowserContext browserContext)
        {
            _browserContext = browserContext;
        }

        private By _breadcrumbs => By.XPath("//li[@class='vh-breadcrumbs']/a");
        private By _nextButton => By.Id(("nextButton"));
        private By _cancelButton => By.Id(("cancelButton"));

        protected IEnumerable<IWebElement> GetListOfElements(By elements) => _browserContext.NgDriver.WaitUntilElementsVisible(elements);
        protected string GetBreadcrumbAttribute(string breadcrumb)
        {
            var getListOfElements = GetListOfElements(_breadcrumbs);
            string breadcrumbAttribute = null;
            foreach (var element in getListOfElements)
            {
                if (breadcrumb == element.Text)
                    breadcrumbAttribute = element.GetAttribute("class");
            }
            return breadcrumbAttribute;
        }

        protected void ClickElement(By element) => _browserContext.NgDriver.WaitUntilElementVisible(element).Click();
        protected void InputValues(By element, string value) => _browserContext.NgDriver.WaitUntilElementVisible(element).SendKeys(value);
        public void NextButton()
        {
            _browserContext.Retry(() => _browserContext.NgDriver.WaitUntilElementClickable(_nextButton).Click());
        }
        public void CancelButton() => _browserContext.NgDriver.WaitUntilElementClickable(_nextButton).Click();
        public string GetElementText(By element) => _browserContext.NgDriver.WaitUntilElementVisible(element).Text;

        protected void SelectOption(By elements, string option)
        {
            var getListOfElements = GetListOfElements(elements);
            _browserContext.Retry(() => getListOfElements.ToArray().Count().Should().BeGreaterThan(0, "List is not populated"));
            foreach (var element in getListOfElements)
            {
                if (option == element.Text.Trim())
                    _browserContext.NgDriver.WaitUntilElementClickable(element).Click();
            }
        }

        public void PageUrl(string url)
        {
            _browserContext.Retry(() => _browserContext.NgDriver.Url.Should().Contain(url));
        }

        public void ClickBreadcrumb(string breadcrumb) => SelectOption(_breadcrumbs, breadcrumb);
    }
}