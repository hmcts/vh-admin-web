using System;
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

        [When(@"the admin adds parties with new users")]
        public void UserAddsPartiesWithNewUsers()
        {
            NavigateToPage();

            var party1 = GetPartyTypes(out var party2);

            AddNonSolicitorParty(party1);
            AddNewPerson(GetLipRoleType(party1));
            AddSolicitorParty(party1);
            AddNewPerson(RoleType.Solicitor);

            AddNonSolicitorParty(party2);
            AddNewPerson(GetLipRoleType(party2));
            AddSolicitorParty(party2);
            AddNewPerson(RoleType.Solicitor);

            _addParticipant.ClickNextButton();
        }

        [When(@"the admin adds parties with existing users")]
        public void UserAddsPartiesWithExistingUsers()
        {
            NavigateToPage();
            var party1 = GetPartyTypes(out var party2);

            AddNonSolicitorParty(party1);
            AddExistingPerson(_context.GetIndividualUsers().First());
            AddSolicitorParty(party1);
            AddExistingPerson(_context.GetRepresentativeUsers().First());

            AddNonSolicitorParty(party2);
            AddExistingPerson(_context.GetIndividualUsers().Last());
            AddSolicitorParty(party2);
            AddExistingPerson(_context.GetRepresentativeUsers().Last());
        }

        private void NavigateToPage()
        {
            _addParticipant.AddItems("RelevantPage", PageUri.AddParticipantsPage);
            _addParticipant.ClickBreadcrumb("Add participants");
            RolesListMatchesUserGroups();
        }

        private PartyType GetPartyTypes(out PartyType party2)
        {
            var party1 = PartyType.Claimant;
            party2 = PartyType.Defendant;

            if (!_context.CurrentUser.UserGroups.Contains(HearingType.FinancialRemedy)) return party1;
            party1 = PartyType.Applicant;
            party2 = PartyType.Respondent;

            return party1;
        }

        private void RolesListMatchesUserGroups()
        {
            if (_context.CurrentUser.UserGroups.Contains(HearingType.CivilMoneyClaims))
                _addParticipant.PartyList().Should().Contain(ParticipantData.MoneyClaimsParty);

            if (_context.CurrentUser.UserGroups.Contains(HearingType.FinancialRemedy))
                _addParticipant.PartyList().Should().Contain(ParticipantData.FinancialRemedyParty);
        }

        private void AddNonSolicitorParty(PartyType partyType)
        {
            _addParticipant.Party(partyType);
            var roleType = GetLipRoleType(partyType);
            _addParticipant.AddRole(roleType);           
        }

        private void AddSolicitorParty(PartyType partyType)
        {
            _addParticipant.Party(partyType);
            _addParticipant.AddRole(RoleType.Solicitor);
        }

        private static RoleType GetLipRoleType(PartyType partyType)
        {
            switch (partyType.ToString())
            {
                case nameof(PartyType.Claimant): return RoleType.ClaimantLIP;
                case nameof(PartyType.Defendant): return RoleType.DefendantLIP;
                case nameof(PartyType.Applicant): return RoleType.ApplicantLIP;
                case nameof(PartyType.Respondent): return RoleType.RespondentLIP;
                default: throw new ArgumentOutOfRangeException($"Party type '{partyType}' not defined.");
            }
        }

        [When(@"user clears inputted values")]
        public void WhenUserClearsInputtedValues()
        {
            _addParticipant.AddItems("Party", _addParticipant.GetSelectedParty());
            _addParticipant.AddItems("Role", _addParticipant.GetSelectedRole());
            _addParticipant.ParticipantEmail($"Automation_{Faker.Internet.Email()}");
            _addParticipant.FirstName($"Automation_{Faker.Name.First()}");
            _addParticipant.LastName(_addParticipant.GetItems("Lastname"));
            _addParticipant.Telephone(_context.TestData.ParticipantData.Telephone);
            _addParticipant.DisplayName($"Automation_{Faker.Name.FullName()}");
            _addParticipant.ClearInput();
        }

        [Then(@"all values should be cleared from the fields")]
        public void ThenAllValuesShouldBeClearedFromTheFields()
        {
            _addParticipant.ClickNextButton();
            _addParticipant.ParticipantPageErrorMessages().Should().Contain(_context.TestData.ErrorMessages.PartyErrorMessage);
            _addParticipant.ParticipantPageErrorMessages().Should().Contain(_context.TestData.ErrorMessages.RoleErrorMessage);
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

        [When(@"participant details are updated")]
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
            _addParticipant.AddParticipantButton();
        }

        private void AddNewPerson(RoleType roleType)
        {
            _addParticipant.ParticipantEmail($"Automation_{Faker.Internet.Email()}");
            _addParticipant.FirstName($"Automation_{Faker.Name.First()}");
            _addParticipant.LastName(_addParticipant.GetItems("Lastname"));
            _addParticipant.Telephone(_context.TestData.ParticipantData.Telephone);
            _addParticipant.DisplayName($"Automation_{Faker.Name.FullName()}");
            if (roleType == RoleType.Solicitor)
            {
                SolicitorInformation();
            }
            else
            {
                AddAddress();
            }
            _addParticipant.AddParticipantButton();
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
    }
}
