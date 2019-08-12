using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using System.Linq;
using AdminWebsite.AcceptanceTests.Configuration;
using AdminWebsite.AcceptanceTests.Contexts;
using AdminWebsite.AcceptanceTests.Data;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class AddParticipantsSteps
    {
        private readonly TestContext _context;
        private readonly AddParticipants _addParticipant;

        public AddParticipantsSteps(TestContext context, AddParticipants addParticipant)
        {
            _context = context;
            _addParticipant = addParticipant;
        }

        [When(@"Admin user is on add participant page")]
        public void UserIsOnTheAddParticipantsPage()
        {
            _addParticipant.PageUrl(PageUri.AddParticipantsPage);
        }

        [When(@"input email address")]
        public void InputEmailAddress(string email)
        {
            if (email == null)
            {
                email = $"Automation_{Faker.Internet.Email()}";
                _addParticipant.AddItems("ParticipantEmail", email);
            }
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
        public void InputFirstname(string firstname = "Automation")
        {
            _addParticipant.FirstName(firstname);
        }

        [When(@"input lastname")]
        public void InputLastname(string lastname)
        {
            if (lastname == null)
            {
                lastname = $"Automation_{Faker.Name.Last()}";
                _addParticipant.AddItems("Lastname", lastname);
            }
            _addParticipant.LastName(lastname);
        }

        [When(@"input telephone")]
        public void InputTelephone(string phone = "0123456789")
        {
            _addParticipant.Phone(phone);
        }

        [When(@"input displayname")]
        public void InputDisplayname(string displayname = "Automation display name")
        {
            _addParticipant.DisplayName(displayname);
        }

        [When(@"click add participants button")]
        public void ClickAddParticipantsButton()
        {
            if (!_addParticipant.RoleValue().Contains(RoleType.Solicitor.ToString()))
            {
                    AddAddress();
            }
            _addParticipant.AddParticipantButton();
        }

        [When(@"select a party")]
        public void SelectParty()
        {
            _addParticipant.Party();
        }

        [When(@"participant details are updated")]
        public void WhenParticipantDetailsAreUpdated()
        {
            UserIsOnTheAddParticipantsPage();
            _addParticipant.AddItems("Party", _addParticipant.GetSelectedParty());
            _addParticipant.AddItems("Role", _addParticipant.GetSelectedRole());
            AddNewPerson();
        }

        [When(@"user selects (.*)")]
        public void WhenUserSelects(string party)
        {
            _addParticipant.AddItems("Party", party);
            switch (_addParticipant.GetItems("CaseTypes"))
            {
                case (ParticipantData.CivilMoneyClaims):
                    _addParticipant.PartyList().Should().BeEquivalentTo(ParticipantData.MoneyClaimsParty);
                    break;
                case (ParticipantData.FinancialRemedy):
                    _addParticipant.PartyList().Should().BeEquivalentTo(ParticipantData.FinancialRemedyParty);
                    break;
            }
            _addParticipant.Party(party);
        }

        [When(@"associated (.*) is selected")]
        public void RoleIsSelected(string role)
        {
            _addParticipant.Role(role);
            AddNewPerson();
            ClickAddParticipantsButton();
        }

        [When(@"user clears inputted values")]
        public void WhenUserClearsInputtedValues()
        {
            _addParticipant.AddItems("Party", _addParticipant.GetSelectedParty());
            _addParticipant.AddItems("Role", _addParticipant.GetSelectedRole());
            AddNewPerson();
            _addParticipant.ClearInput();
        }

        [Then(@"all values should be cleared from the fields")]
        public void ThenAllValuesShouldBeClearedFromTheFields()
        {
            _addParticipant.ClickNextButton();
            _addParticipant.ParticipantPageErrorMessages().Should().Contain(_context.TestData.ErrorMessages.PartyErrorMessage);
            _addParticipant.ParticipantPageErrorMessages().Should().Contain(_context.TestData.ErrorMessages.RoleErrorMessage);
        }

        [When(@"admin adds participant details")]
        public void WhenAdminAddsParticipant()
        {
            switch (_addParticipant.GetItems("Party"))
            {
                case (ParticipantData.Claimant):
                    _addParticipant.RoleList().Should().BeEquivalentTo(ParticipantData.ClaimantRole);
                    break;
                case (ParticipantData.Defendant):
                    _addParticipant.RoleList().Should().BeEquivalentTo(ParticipantData.DefendantRole);
                    break;
                case (ParticipantData.Applicant):
                    _addParticipant.RoleList().Should().BeEquivalentTo(ParticipantData.ApplicantRole);
                    break;
                case (ParticipantData.Respondent):
                    _addParticipant.RoleList().Should().BeEquivalentTo(ParticipantData.RespondentRole);
                    break;
            }
            _addParticipant.AddItems("Role", _addParticipant.GetSelectedRole());
            AddNewPerson();
            ClickAddParticipantsButton();
        }

        [Then(@"Participant detail is displayed on the list")]
        public void ThenParticipantDetailIsDisplayedOnTheList()
        {
            var expectedResult = $"{_addParticipant.GetItems("Title")} {_context.TestData.ParticipantData.Firstname} {_addParticipant.GetItems("Lastname")} {_addParticipant.GetItems("Role")}";
            var actualResult = _addParticipant.GetParticipantDetails().Replace("\r\n", " ");
            if (_addParticipant.GetItems("Role") == RoleType.Solicitor.ToString())
            {
                var clientRepresenting = _addParticipant.GetItems("ClientRepresenting");
                actualResult.Should().Be($"{expectedResult}, representing {clientRepresenting}");
            }
            else
            {
                actualResult.Should().Be(expectedResult.Trim());
            }
        }

        [When(@"participant details is updated")]
        public void WhenParticipantDetailsIsUpdated()
        {
            if (!_addParticipant.RoleValue().Contains(RoleType.Solicitor.ToString()))
                AddAddress();
            _addParticipant.PartyFieldEnabled.Should().BeFalse();
            _addParticipant.RoleFieldEnabled.Should().BeFalse();
            _addParticipant.EmailEnabled.Should().BeFalse();
            _addParticipant.FirstnameEnabled.Should().BeFalse();
            _addParticipant.LastnameEnabled.Should().BeFalse();
        }

        private void AddAddress()
        {
            var houseNumber = _context.TestData.ParticipantData.HouseNumber;
            var street = _context.TestData.ParticipantData.Street;
            var city = _context.TestData.ParticipantData.City;
            var county = _context.TestData.ParticipantData.County;
            var postcode = _context.TestData.ParticipantData.PostCode;

            _addParticipant.AddItems("HouseNumber", houseNumber);
            _addParticipant.AddItems("Street", street);
            _addParticipant.AddItems("City", city);
            _addParticipant.AddItems("County", county);
            _addParticipant.AddItems("Postcode", postcode);

            _addParticipant.HouseNumber(houseNumber);
            _addParticipant.Street(street);
            _addParticipant.City(city);
            _addParticipant.County(county);
            _addParticipant.Postcode(postcode);
        }

        [When(@"user adds new participant to a hearing")]
        public void NewParticipantIsAddedToHearing()
        {
            UserIsOnTheAddParticipantsPage();
            SelectParty();
            SelectRole();
            AddNewPerson();
            ClickAddParticipantsButton();
        }

        [When(@"user adds existing participant to hearing")]
        public void WhenUserAddsExistingParticipantToHearing()
        {
            UserIsOnTheAddParticipantsPage();
            var user = _context.UserAccounts.First(x => x.DefaultParticipant.Equals(true));
            AddPartyDetails(user);
            AddExistingPerson(user);
            ClickAddParticipantsButton();
            _addParticipant.ClickNextButton();
            _addParticipant.ClickBreadcrumb("Summary");
        }

        private void AddPartyDetails(UserAccount user)
        {
            _addParticipant.AddItems("RelevantPage", PageUri.AddParticipantsPage);
            _addParticipant.ClickBreadcrumb("Add participants");
            _addParticipant.Party(user.CaseRoleName);
            _addParticipant.Role(user.HearingRoleName);
        }

        private void AddExistingPerson(UserAccount user)
        {
            var email = user.AlternativeEmail;
            _addParticipant.ParticipantEmail(email.Substring(0, 3));
            _addParticipant.ExistingParticipant(email);
            _addParticipant.DisplayName(user.Displayname);
            _addParticipant.EmailEnabled.Should().BeFalse();
            _addParticipant.FirstnameEnabled.Should().BeFalse();
            _addParticipant.LastnameEnabled.Should().BeFalse();
            _addParticipant.GetFieldValue("phone").Should().NotBeNullOrEmpty();
            _addParticipant.GetFieldValue("houseNumber").Should().NotBeNullOrEmpty();
            _addParticipant.GetFieldValue("street").Should().NotBeNullOrEmpty();
            _addParticipant.GetFieldValue("city").Should().NotBeNullOrEmpty();
            _addParticipant.GetFieldValue("county").Should().NotBeNullOrEmpty();
            _addParticipant.GetFieldValue("postcode").Should().NotBeNullOrEmpty();
            if (_addParticipant.RoleValue().Contains("Solicitor"))
            {
                SolicitorInformation(user.Representee);
            }
        }

        private void AddNewPerson()
        {
            var email = $"Automation_{Faker.Internet.Email()}";
            _addParticipant.AddItems("ParticipantEmail", email);
            InputEmailAddress(email);
            _addParticipant.AddItems("Title", _addParticipant.GetSelectedTitle());
            InputFirstname(_context.TestData.ParticipantData.Firstname);
            InputLastname(_addParticipant.GetItems("Lastname"));
            InputTelephone(_context.TestData.ParticipantData.Telephone);
            InputDisplayname(_context.TestData.ParticipantData.DisplayName);
            if (_addParticipant.RoleValue().Contains("Solicitor"))
            {
                SolicitorInformation();
            }
        }

        private void SolicitorInformation(string representee = "MadeUp")
        {
            var organisation = $"Automation_{Faker.Company.Name()}";
            _addParticipant.Organisation(organisation);
            _addParticipant.AddItems("Organisation", organisation);
            var solicitorReference = Faker.Company.CatchPhrase();
            _addParticipant.SoliicitorReference(solicitorReference);
            _addParticipant.AddItems("Company", solicitorReference);
            _addParticipant.ClientRepresenting(representee);
            _addParticipant.AddItems("ClientRepresenting", representee);
        }
    }
}
