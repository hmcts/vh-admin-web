using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class AddParticipantsSteps
    {
        private readonly AddParticipants _addParticipant;

        public AddParticipantsSteps(AddParticipants addParticipant)
        {
            _addParticipant = addParticipant;
        }
        [When(@"professional participant is added to hearing")]
        public void ProfessionalParticipantIsAddedToHearing()
        {
            AddParticipantsPage();
            InputEmailAddress();
            InputFirstname();
            InputLastname();
            InputTelephone();
            SelectRole();
            InputDisplayname();
            SelectTitle();
            ClickAddParticipantsButton();
        }
        [When(@"Admin user is on add participant page")]
        public void AddParticipantsPage()
        {
            _addParticipant.PageUrl(PageUri.AddParticipantsPage);
        }
        [When(@"input email address")]
        public void InputEmailAddress(string email = "dummyemail@email.com")
        {
            _addParticipant.ParticipantEmail(email);
        }
        [When(@"select a role")]
        public void SelectRole(string role = "Professional")
        {
            _addParticipant.Role(role);
        }
        [When(@"select a title")]
        public void SelectTitle()
        {
            _addParticipant.Title();
        }
        [When(@"input firstname")]
        public void InputFirstname(string firstname = "Dummy")
        {
            _addParticipant.FirstName(firstname);
        }
        [When(@"input lastname")]
        public void InputLastname(string lastname = "Email")
        {
            _addParticipant.LastName(lastname);
        }
        [When(@"input telephone")]
        public void InputTelephone(string phone = "0123456789")
        {
            _addParticipant.Phone(phone);
        }        
        [When(@"input displayname")]
        public void InputDisplayname(string displayname = "Dummy Email")
        {
            _addParticipant.DisplayName(displayname);
        }
        [When(@"click add participants button")]
        public void ClickAddParticipantsButton()
        {
            _addParticipant.AddParticipantButton();
        }
    }
}