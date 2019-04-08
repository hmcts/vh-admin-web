using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;
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
        public string PartyField() => GetAttribute(By.Id("party"));
        public string RoleField() => GetAttribute(By.Id("role"));
        public string Email() => GetAttribute(By.Id("participantEmail"));
        public string Firstname() => GetAttribute(By.Id("firstName"));
        public string Lastname() => GetAttribute(By.Id("lastName"));
    }
}