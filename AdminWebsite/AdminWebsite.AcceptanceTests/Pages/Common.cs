using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;
using System.Collections.Generic;
using FluentAssertions;
using System.Linq;
using System;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class Common
    {
        private readonly Browser _browser;

        public Common(Browser browser)
        {
            _browser = browser;
        }

        private static By Breadcrumbs => By.XPath("//li[@class='vh-breadcrumbs']/a");
        private static By NextButton => By.Id(("nextButton"));
        private static By CancelButton => By.Id(("cancelButton"));
        private static By TryAgainButton => By.Id("btnTryAgain");
        private static By TryAgainMessage => By.XPath("//*[@class='govuk-heading-m vh-ml70 vh-mr70']");

        protected IEnumerable<IWebElement> GetListOfElements(By elements)
        {
            IEnumerable<IWebElement> webElements = null;
            try
            {
                webElements = _browser.NgDriver.WaitUntilElementsVisible(elements);
            }
            catch (Exception ex)
            {
                webElements = _browser.NgDriver.FindElements(elements);
                Console.WriteLine(ex);
            }
            return webElements;
        }
        protected string GetBreadcrumbAttribute(string breadcrumb)
        {
            var getListOfElements = GetListOfElements(Breadcrumbs);
            string breadcrumbAttribute = null;
            foreach (var element in getListOfElements)
            {
                if (breadcrumb == element.Text)
                    breadcrumbAttribute = element.GetAttribute("class");
            }
            return breadcrumbAttribute;
        }

        protected void InputValues(By element, string value) => _browser.NgDriver.WaitUntilElementVisible(element).SendKeys(value);
        protected void ClickElement(By element) => _browser.NgDriver.WaitUntilElementClickable(element).Click();
        protected void ClickCheckboxElement(By element) => _browser.NgDriver.FindElement(element).Click();

        protected void ClearFieldInputValues(By element, string value)
        {
            var webElement = _browser.NgDriver.WaitUntilElementVisible(element);
            webElement.Clear();
            webElement.SendKeys(value);
        }

        public void ClickNextButton()
        {
            _browser.NgDriver.ExecuteScript("arguments[0].scrollIntoView(true);", _browser.NgDriver.FindElement(NextButton));
            _browser.Retry(() => _browser.NgDriver.ClickAndWaitForPageToLoad(NextButton));
        }

        public void ClickBookButton()
        {
            _browser.Retry(() => _browser.NgDriver.ClickAndWaitForPageToLoad(By.Id("bookButton")));
        }

        public void ClickCancelButton() => _browser.NgDriver.ClickAndWaitForPageToLoad(CancelButton);

        public string GetElementText(By element)
        {
            var webElementText = string.Empty;
            _browser.Retry(() =>
            {
                webElementText = _browser.NgDriver.WaitUntilElementVisible(element).Text.Trim();
            }, 1);
            return webElementText;
        }

        protected void SelectOption(By elements, string option)
        {
            var getListOfElements = GetListOfElements(elements);
            _browser.Retry(() => getListOfElements.Count().Should().BeGreaterThan(0, "List is not populated"));
            foreach (var element in getListOfElements)
            {
                if (option != element.Text.Trim()) continue;
                _browser.NgDriver.WaitUntilElementClickable(element).Click();
                break;
            }
        }
        protected void SelectFirstOption(By elements)
        {
            var getListOfElements = GetListOfElements(elements);
            _browser.Retry(() => getListOfElements.Count().Should().BeGreaterThan(0, "List is not populated"));
            _browser.NgDriver.WaitUntilElementClickable(getListOfElements.First()).Click();
        }

        protected string SelectLastItem(By elements)
        {
            var getListOfElements = GetListOfElements(elements);
            var listOfElements = getListOfElements as IWebElement[] ?? getListOfElements.ToArray();
            var list1 = listOfElements.ToList();
            _browser.Retry(() => list1.Count.Should().BeGreaterThan(0, "List is not populated"));
            var list = listOfElements.ToList();
            var lastItem = _browser.NgDriver.WaitUntilElementClickable(list.Last());
            lastItem.Click();
            return lastItem.Text.Trim();
        }

        public void PageUrl(string url)
        {
            if (url != PageUri.BookingConfirmationPage)
            {
                _browser.Retry(() => _browser.NgDriver.Url.Should().Contain(url));
            }
            else
            {
                try
                {
                    _browser.Retry(() => _browser.NgDriver.Url.Should().Contain(url));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Re-submit booking: {ex}");
                    if (GetElementText(TryAgainMessage) == Data.BookingConfirmation.TryAgainMessage)                  

                    {
                        ClickElement(TryAgainButton);
                        _browser.Retry(() => _browser.NgDriver.Url.Should().Contain(url), 2);
                    }                    
                }
            }                      
        }

        public void ClickBreadcrumb(string breadcrumb) => SelectOption(Breadcrumbs, breadcrumb);
        public void AcceptBrowserAlert() => _browser.AcceptAlert();
        public void DashBoard() => ClickElement(By.Id("topItem0"));
        public void BookingsList() => ExecuteScript("document.getElementById('topItem1').click()");
        public void AddItems<T>(string key, T value) => _browser.Items.AddOrUpdate(key, value);
        public dynamic GetItems(string key) => _browser.Items.Get(key);
        public string GetParticipantDetails() => GetElementText(By.XPath("//*[contains(@class, 'vhtable-header')]"));

        public List<string> GetAllParticipantsDetails()
        {
            var elements = _browser.NgDriver.WaitUntilElementsVisible(By.XPath("//*[contains(@class, 'vhtable-header')]"));
            return elements.Select(element => element.Text.Trim().Replace("\r\n", " ")).ToList();
        }

        protected IEnumerable<string> Items(By elements)
        {
            var webElements = _browser.NgDriver.WaitUntilElementsVisible(elements);
            return webElements.Select(element => element.Text.Trim()).ToList();
        }
        public string ExecuteScript(string script) => _browser.ExecuteJavascript(script);
        public string Page() => _browser.PageUrl();
        public string CancelWarningMessage() => GetElementText(By.XPath("//*[@class='content']/h1"));
        public void DiscardChanges() => ClickElement(By.Id("btn-discard-changes"));       
        public int DisabledFields() => GetListOfElements(By.XPath("//*[@disabled='true']")).ToList().Count;
        public string GetAttribute(By element) => _browser.NgDriver.WaitUntilElementVisible(element).GetAttribute("disabled");
        public bool IsElementEnabled(By element) => _browser.NgDriver.WaitUntilElementVisible(element).Enabled;
        public string ExecuteScript(string script, By element)
        {
            _browser.NgDriver.WaitUntilElementVisible(element);
           return  _browser.ExecuteJavascript(script);
        }
    }
}