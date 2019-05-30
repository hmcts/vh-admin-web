using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Linq;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class AddParticipants : Common
    {
        public AddParticipants(BrowserContext browserContext) : base(browserContext)
        {
        }
        private By _companyName => By.Id("companyName");
        public void Title() => SelectOption(CommonLocator.List("title"));
        public string GetSelectedTitle() => SelectLastItem(CommonLocator.List("title"));
        public void ParticipantEmail(string email) => ClearFieldInputValues(By.Id("participantEmail"), email);
        public void FirstName(string firstname) => ClearFieldInputValues(By.Id("firstName"), firstname);
        public void LastName(string lastname) => ClearFieldInputValues(By.Id("lastName"), lastname);
        public void Phone(string phone) => ClearFieldInputValues(By.Id("phone"), phone);
        public void DisplayName(string displayname) => ClearFieldInputValues(By.Id("displayName"), displayname);
        public void AddParticipantButton() => ClickElement(By.Id("addParticipantBtn"));
        public void Party() => SelectOption(CommonLocator.List("party"));
        public void Role() => SelectOption(CommonLocator.List("role"));
        public string GetSelectedParty() => SelectLastItem(CommonLocator.List("party"));
        public string GetSelectedRole() => SelectLastItem(CommonLocator.List("role"));
        public void Party(string party) => SelectOption(CommonLocator.List("party"), party);
        public void Role(string role) => SelectOption(CommonLocator.List("role"), role);
        public IEnumerable<string> PartyList() => Items(CommonLocator.List("party"));
        public IEnumerable<string> RoleList() => Items(CommonLocator.List("role"));
        public void ClearInput() => ClickElement(By.Id("clearFormBtn"));
        public string PartyErrorMessage() => GetElementText(By.Id("party-error"));
        public string RoleErrorMessage() => GetElementText(By.Id("role-error"));
        public IEnumerable<string> ParticipantPageErrorMessages() => Items(By.XPath("//*[@class='govuk-list govuk-error-summary__list']/li"));
        public bool PartyField() => IsElementEnabled(By.Id("party"));
        public bool RoleField() => IsElementEnabled(By.Id("role"));
        public bool Email() => IsElementEnabled(By.Id("participantEmail"));
        public bool Firstname() => IsElementEnabled(By.Id("firstName"));
        public bool Lastname() => IsElementEnabled(By.Id("lastName"));
        public void HouseNumber(string houseNumber) => ClearFieldInputValues(By.Id("houseNumber"), houseNumber);
        public void Street(string street) => ClearFieldInputValues(By.Id("street"), street);
        public void City(string city) => ClearFieldInputValues(By.Id("city"), city);
        public void County(string county) => ClearFieldInputValues(By.Id("county"), county);
        public void Postcode(string postcode) => ClearFieldInputValues(By.Id("postcode"), postcode);
        public string RoleValue() => ExecuteScript("return document.getElementById('role').value", By.Id("role"));
        public void Organisation(string organisation) => ClearFieldInputValues(_companyName, organisation);
        public void SoliicitorReference(string reference) => ClearFieldInputValues(By.Id("solicitorReference"), reference);
        public void ClientRepresenting(string client) => ClearFieldInputValues(By.Id("representing"), client);
        public void ExistingParticipant(string contactEmail)
        {
            var webElement = GetListOfElements(By.CssSelector("a.vh-a-email")).Single(u => u.Text == contactEmail);
            if (webElement == null)
            {
                throw new Exception($"Failed to find an existing person in response matching contact email: {contactEmail}");
            }
            else
            {
                webElement.Click();
            }
        }
        public string GetFieldValue(string field) => ExecuteScript($"return document.getElementById('{field}').value");
    }
}