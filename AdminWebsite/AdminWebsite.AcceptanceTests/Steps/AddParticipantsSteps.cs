using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
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
            AddParticpantDetails();
            SelectRole();
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
        [When(@"select a party")]
        public void SelectParty()
        {
            _addParticipant.Party();
        }
        [When(@"participant detail is updated")]
        public void WhenPaticipantDetailIsUpdated()
        {
            AddParticipantsPage();
            _addParticipant.AddItems<string>("Party", _addParticipant.GetSelectedParty());
            _addParticipant.AddItems<string>("Role", _addParticipant.GetSelectedRole());
            AddParticpantDetails();
        }
        [When(@"user selects (.*)")]
        public void WhenUserSelects(string party)
        {
           _addParticipant.AddItems<string>("Party", party);            
            switch (_addParticipant.GetItems("CaseType"))
            {
                case (TestData.AddParticipants.CivilMoneyClaims):
                    _addParticipant.PartyList().Should().BeEquivalentTo(TestData.AddParticipants.MoneyClaimsParty);
                    break;
                case (TestData.AddParticipants.FinancialRemedy):
                    _addParticipant.PartyList().Should().BeEquivalentTo(TestData.AddParticipants.FinancialRemedyParty);
                    break;
            }
            _addParticipant.Party(party);
        }
        [When(@"user clears inputted values")]
        public void WhenUserClearsInputtedValues()
        {
            _addParticipant.AddItems<string>("Party", _addParticipant.GetSelectedParty());
            _addParticipant.AddItems<string>("Role", _addParticipant.GetSelectedRole());
            AddParticpantDetails();
            _addParticipant.ClearInput();
        }
        [Then(@"all values should be cleared from the fields")]
        public void ThenAllValuesShouldBeClearedFromTheFields()
        {
            _addParticipant.PartyErrorMessage().Should().Be(TestData.AddParticipants.PartyErrorMessage);
            _addParticipant.RoleErrorMessage().Should().Be(TestData.AddParticipants.RoleErrorMessage);
        }

        [When(@"use adds participant")]
        public void WhenUseAddsParticipant()
        {
            switch (_addParticipant.GetItems("Party"))
            {
                case (TestData.AddParticipants.Claimant):
                    _addParticipant.RoleList().Should().BeEquivalentTo(TestData.AddParticipants.ClaimantRole);
                    break;
                case (TestData.AddParticipants.Defendant):
                    _addParticipant.RoleList().Should().BeEquivalentTo(TestData.AddParticipants.DefendantRole);
                    break;
                case (TestData.AddParticipants.Applicant):
                    _addParticipant.RoleList().Should().BeEquivalentTo(TestData.AddParticipants.ApplicantRole);
                    break;
                case (TestData.AddParticipants.Respondent):
                    _addParticipant.RoleList().Should().BeEquivalentTo(TestData.AddParticipants.RespondentRole);
                    break;
            }
            _addParticipant.Role();
            AddParticpantDetails();
            ClickAddParticipantsButton();
        }
        [Then(@"Participant detail is displayed on the list")]
        public void ThenParticipantDetailIsDisplayedOnTheList()
        {
            string expectedResult = $"{_addParticipant.GetItems("Title")} {TestData.AddParticipants.Firstname} {TestData.AddParticipants.Lastname} {_addParticipant.GetItems("Party")}";
            var actualResult = _addParticipant.GetParticipantDetails().Replace("\r\n", " ");
            actualResult.Should().Be(expectedResult.Trim());
        }
        public void AddParticpantDetails()
        {            
            InputEmailAddress(TestData.AddParticipants.Email);
            _addParticipant.AddItems<string>("Title", _addParticipant.GetSelectedTitle());
            InputFirstname(TestData.AddParticipants.Firstname);
            InputLastname(TestData.AddParticipants.Lastname);
            InputTelephone(TestData.AddParticipants.Telephone);
            InputDisplayname(TestData.AddParticipants.DisplayName);            
        }
    }
}