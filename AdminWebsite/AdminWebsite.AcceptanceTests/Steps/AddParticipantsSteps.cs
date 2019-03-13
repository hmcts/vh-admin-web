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
            SelectParty();
            SelectRole();
            InputEmailAddress();
            SelectTitle();
            InputFirstname();
            InputLastname();
            InputTelephone();
            InputDisplayname();
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
        public void SelectRole()
        {
            _addParticipant.Role();
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

        [When(@"select a party")]
        public void SelectParty()
        {
            _addParticipant.Party();
        }
        [When(@"participant detail is updated")]
        public void WhenPaticipantDetailIsUpdated()
        {
            AddParticipantsPage();
            SelectParty();
            SelectRole();
            InputEmailAddress(TestData.AddParticipants.Email);
            _addParticipant.AddItems<string>("Title", _addParticipant.GetSelectedTitle());
            InputFirstname(TestData.AddParticipants.Firstname);
            InputLastname(TestData.AddParticipants.Lastname);
            InputTelephone(TestData.AddParticipants.Telephone);
            InputDisplayname(TestData.AddParticipants.DisplayName);
        }
    }
}