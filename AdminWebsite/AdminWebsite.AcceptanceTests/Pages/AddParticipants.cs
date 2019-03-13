using AdminWebsite.AcceptanceTests.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class AddParticipants : Common
    {
        public AddParticipants(BrowserContext browserContext) : base(browserContext)
        {
        }
        private By _participantEmail => By.Id("participantEmail");
        private By _firstName => By.Id("firstName");
        private By _lastName => By.Id("lastName");
        private By _phone => By.Id("phone");
        private By _displayName => By.Id("displayName");
        private By _addParticipantButton => By.Id("addParticipantBtn");
        private By _companyName => By.Id("companyName");

        public void Role(string option) => SelectOption(CommonLocator.List("role"), option);
        public void Title() => SelectOption(CommonLocator.List("title"));
        public string GetSelectedTitle() => SelectLastItem(CommonLocator.List("title"));
        public void ParticipantEmail(string email) => ClearFieldInputValues(_participantEmail, email);
        public void FirstName(string firstname) => ClearFieldInputValues(_firstName, firstname);
        public void LastName(string lastname) => ClearFieldInputValues(_lastName, lastname);
        public void Phone(string phone) => ClearFieldInputValues(_phone, phone);
        public void DisplayName(string displayname) => ClearFieldInputValues(_displayName, displayname);
        public void AddParticipantButton() => ClickElement(_addParticipantButton);
        public void Party() => SelectOption(CommonLocator.List("party"));
        public void Role() => SelectOption(CommonLocator.List("role"));
        public string GetSelectedParty() => SelectLastItem(CommonLocator.List("party"));
        public string GetSelectedRole() => SelectLastItem(CommonLocator.List("role"));
    }
}