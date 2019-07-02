using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using System;
using System.Linq;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class AddParticipantsSteps
    {
        private readonly AddParticipants _addParticipant;
        private readonly ScenarioContext _scenarioContext;

        public AddParticipantsSteps(AddParticipants addParticipant, ScenarioContext scenarioContext)
        {
            _addParticipant = addParticipant;
            _scenarioContext = scenarioContext;
        }
        [When(@"professional participant is added to hearing")]
        public void ProfessionalParticipantIsAddedToHearing()
        {
            AddParticipantsPage();
            SelectParty();
            SelectRole();
            AddParticpantDetails();
            ClickAddParticipantsButton();
        }
        [When(@"Admin user is on add participant page")]
        public void AddParticipantsPage()
        {
            _addParticipant.PageUrl(PageUri.AddParticipantsPage);
        }
        [When(@"input email address")]
        public void InputEmailAddress(string email)
        {
            if (email == null)
            {
                email = Faker.Internet.Email();
                _addParticipant.AddItems<string>("ParticipantEmail", email);
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
        public void InputFirstname(string firstname = "Dummy")
        {
            _addParticipant.FirstName(firstname);
        }
        [When(@"input lastname")]
        public void InputLastname(string lastname)
        {
            if (lastname == null)
            {
                lastname = Faker.Name.Last();
                _addParticipant.AddItems<string>("Lastname", lastname);
            }
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
            var tag = _scenarioContext.ScenarioInfo.Tags;
            if (!_addParticipant.RoleValue().Contains(RoleType.Solicitor.ToString()))
            {
                if (!tag.Contains("ExistingPerson"))
                {
                    Address();
                }
            }
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
        [When(@"associated (.*) is selected")]
        public void RoleIsSelected(string role)
        {
            _addParticipant.Role(role);
            AddParticpantDetails();
            ClickAddParticipantsButton();
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
            _addParticipant.NextButton();
            _addParticipant.ParticipantPageErrorMessages().Should().Contain(TestData.AddParticipants.PartyErrorMessage);
            _addParticipant.ParticipantPageErrorMessages().Should().Contain(TestData.AddParticipants.RoleErrorMessage);
        }
        [When(@"admin adds participant details")]
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
            _addParticipant.AddItems<string>("Role", _addParticipant.GetSelectedRole());
            AddParticpantDetails();
            ClickAddParticipantsButton();
        }
        [Then(@"Participant detail is displayed on the list")]
        public void ThenParticipantDetailIsDisplayedOnTheList()
        {
            string expectedResult = $"{_addParticipant.GetItems("Title")} {TestData.AddParticipants.Firstname} {_addParticipant.GetItems("Lastname")} {_addParticipant.GetItems("Role")}";
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
        public void AddParticpantDetails()
        {
            var tag = _scenarioContext.ScenarioInfo.Tags;
            if (tag.Contains("ExistingPerson"))
                ExistingPerson();
            else
                NonExistingPerson();
        }
        [When(@"participant details is updated")]
        public void WhenParticipantDetailsIsUpdated()
        {
            if (!_addParticipant.RoleValue().Contains(RoleType.Solicitor.ToString()))
                Address();
            _addParticipant.PartyFieldEnabled.Should().BeFalse();
            _addParticipant.RoleFieldEnabled.Should().BeFalse();
            _addParticipant.EmailEnabled.Should().BeFalse();
            _addParticipant.FirstnameEnabled.Should().BeFalse();
            _addParticipant.LastnameEnabled.Should().BeFalse();
        }
        private void Address()
        {
            var houseNumber = Faker.RandomNumber.Next().ToString();
            var street = Faker.Address.StreetAddress();
            var city = Faker.Address.City();
            var county = Faker.Address.UkCountry();
            var postcode = Faker.Address.UkPostCode();

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
        [When(@"user adds existing participant to hearing")]
        public void WhenUserAddsExistingParticipantToHearing()
        {
            _addParticipant.AddItems<string>("RelevantPage", PageUri.AddParticipantsPage);
            _addParticipant.ClickBreadcrumb("Add participants");
            _addParticipant.Party(TestData.AddParticipants.Defendant);
            _addParticipant.Role(TestData.AddParticipants.DefendantRole.First());
            ExistingPerson();
            ClickAddParticipantsButton();
            _addParticipant.NextButton();
            _addParticipant.ClickBreadcrumb("Summary");
        }
        private void ExistingPerson()
        {
            var email = TestData.AddParticipants.Email;
            _addParticipant.ParticipantEmail(email.Substring(0, 3));
            _addParticipant.ExistingParticipant(email);
            _addParticipant.DisplayName(TestData.AddParticipants.DisplayName);
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
                SolicitorInformation();
            }
        }
        private void NonExistingPerson()
        {
            var email = Faker.Internet.Email();
            _addParticipant.AddItems<string>("ParticipantEmail", email);
            InputEmailAddress(email);
            _addParticipant.AddItems<string>("Title", _addParticipant.GetSelectedTitle());
            InputFirstname(TestData.AddParticipants.Firstname);
            InputLastname(_addParticipant.GetItems("Lastname"));
            InputTelephone(TestData.AddParticipants.Telephone);
            InputDisplayname(TestData.AddParticipants.DisplayName);
            if (_addParticipant.RoleValue().Contains("Solicitor"))
            {
                SolicitorInformation();
            }
        }
        private void SolicitorInformation()
        {
            var organisation = Faker.Company.Name();
            _addParticipant.Organisation(organisation);
            _addParticipant.AddItems<string>("Organisation", organisation);
            var solicitorReference = Faker.Company.CatchPhrase();
            _addParticipant.SoliicitorReference(solicitorReference);
            _addParticipant.AddItems<string>("Company", solicitorReference);
            var clientDetails = Faker.Name.FullName();
            _addParticipant.ClientRepresenting(clientDetails);
            _addParticipant.AddItems<string>("ClientRepresenting", clientDetails);
        }
    }
}
