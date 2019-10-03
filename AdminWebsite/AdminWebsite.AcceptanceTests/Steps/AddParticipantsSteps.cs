using System;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using System.Linq;
using AdminWebsite.AcceptanceTests.Configuration;
using AdminWebsite.AcceptanceTests.Contexts;
using AdminWebsite.AcceptanceTests.Data;
using TechTalk.SpecFlow;
using System.Collections.Generic;
using System.Threading;

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

            ThenParticipantDetailAreDisplayedInTheList();
            _addParticipant.ClickNextButton();
        }


        [When(@"the admin adds parties with existing users")]
        public void UserAddsPartiesWithExistingUsers()
        {
            AddExistingParticipantToDb();

            NavigateToPage();
            var party1 = GetPartyTypes(out var party2);

            AddNonSolicitorParty(party1);
            AddExistingPerson(_context.GetIndividualUsers().First(), GetLipRoleType(party1));
            AddSolicitorParty(party1);
            AddExistingPerson(_context.GetRepresentativeUsers().First(), RoleType.Solicitor);

            AddNonSolicitorParty(party2);
            AddExistingPerson(_context.GetIndividualUsers().Last(), GetLipRoleType(party2));
            AddSolicitorParty(party2);
            AddExistingPerson(_context.GetRepresentativeUsers().Last(), RoleType.Solicitor);

            ThenParticipantDetailAreDisplayedInTheList();
            _addParticipant.ClickNextButton();
        }

        private void AddExistingParticipantToDb()
        {
            var endpoints = new HearingsEndpoints();
            DataSetupHelper dataSetupHelper = new DataSetupHelper();

            if (dataSetupHelper.GetParticipantsNotInTheDb(_context).Count() > 0)
            {
                dataSetupHelper.CreateNewHearingRequest(_context, endpoints);
            }
        }

        [Given(@"the admin added participants using (.*) user details")]
        public void UserAddsParticipantDetails(string userType)
        {
            var party1 = GetPartyTypes(out var party2);

            AddNonSolicitorParty(party1);
            bool clickAdd = false;

            switch (userType)
            {
                case "any":
                case "new":
                    AddNewPerson(GetLipRoleType(party1), clickAdd);
                    break;
                case "existing":
                    AddExistingPerson(_context.GetIndividualUsers().First(), GetLipRoleType(party1), clickAdd);
                    break;
                default:
                    throw new NotSupportedException($"The user type (userType) is not supported");
            }

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
                _addParticipant.PartyList().Should().BeEquivalentTo(PartyTypes.MoneyClaimsParty);

            if (_context.CurrentUser.UserGroups.Contains(HearingType.FinancialRemedy))
                _addParticipant.PartyList().Should().BeEquivalentTo(PartyTypes.FinancialRemedyParty);
        }

        private void AddNonSolicitorParty(PartyType partyType)
        {
            _addParticipant.AddParty(partyType);
            var roleType = GetLipRoleType(partyType);
            _addParticipant.AddRole(roleType.ToString().Replace("LIP", " LIP"));
        }

        private void AddSolicitorParty(PartyType partyType)
        {
            _addParticipant.AddParty(partyType);
            _addParticipant.AddRole(RoleType.Solicitor.ToString());
        }

        private static RoleType GetLipRoleType(PartyType partyType)
        {
            Enum.TryParse($"{partyType.ToString()}LIP", out RoleType roleType);
            return roleType;
        }

        [When(@"user clears inputted values")]
        public void WhenUserClearsInputtedValues()
        {
            _context.TestData.ParticipantData.Add(new IndividualData());
            var participant = _context.TestData.ParticipantData.Last();
            ClearInputData(participant);
            _addParticipant.ClearInput();
            _addParticipant.WaitForAddParticipantDetailsFormHidden();
        }

        [When(@"the user follows the clear details call to action")]
        public void WhenUserFollowsClearDetailsCTA()
        {
            _addParticipant.ClearInput();
        }

        [Then(@"add participant form values should be cleared")]
        public void ThenAddParticipantFormValuesShouldBeCleared()
        {
            var errorFields = _addParticipant.ValidateAddParticipantFormIsCleared();
            errorFields.Should().BeNullOrEmpty();
        }

        [Then(@"all values should be cleared from the fields")]
        public void ThenAllValuesShouldBeClearedFromTheFields()
        {
            _addParticipant.ClickNextButton();
            _addParticipant.ParticipantPageErrorMessages().Should().Contain(_context.TestData.ErrorMessages.PartyErrorMessage);
            _addParticipant.ParticipantPageErrorMessages().Should().Contain(_context.TestData.ErrorMessages.RoleErrorMessage);
        }

        [When(@"participant details are updated")]
        public void WhenParticipantDetailsAreUpdated()
        {
            if (!_addParticipant.RoleValue().Contains(RoleType.Solicitor.ToString()))
            {
                var participant = _context.TestData.ParticipantData.First();
                _context.TestData.ParticipantData.First().HouseNumber = participant.Update(participant.HouseNumber);
                _context.TestData.ParticipantData.First().Street = participant.Update(participant.Street);
                _context.TestData.ParticipantData.First().City = participant.Update(participant.City);
                _context.TestData.ParticipantData.First().County = participant.Update(participant.County);
                _context.TestData.ParticipantData.First().PostCode = participant.Update(participant.PostCode);

                var newParticipantAddress = new IndividualData
                {
                    HouseNumber = _context.TestData.ParticipantData.First().HouseNumber,
                    Street = _context.TestData.ParticipantData.First().Street,
                    City = _context.TestData.ParticipantData.First().City,
                    County = _context.TestData.ParticipantData.First().County,
                    PostCode = _context.TestData.ParticipantData.First().PostCode
                };
                AddAddress(newParticipantAddress);
            }
            _addParticipant.EmailEnabled.Should().BeFalse();
            _addParticipant.FirstnameEnabled.Should().BeFalse();
            _addParticipant.LastnameEnabled.Should().BeFalse();
        }

        private void AddExistingPerson(UserAccount user, RoleType roleType, bool clickAdd = true)
        {
            if (user.Role.Equals(RoleType.Individual.ToString()))
            {
                _context.TestData.ParticipantData.Add(new IndividualData());
            }
            else if (user.Role.Equals(RoleType.Representative.ToString()))
            {
                _context.TestData.ParticipantData.Add(new RepresentativeData());
            }
            _context.TestData.ParticipantData.Last().AddUserData(user);
            _context.TestData.ParticipantData.Last().Role = roleType;

            var email = user.AlternativeEmail;
            _addParticipant.ParticipantEmail(email.Substring(0, 3));
            _addParticipant.ExistingParticipant(email);
            _addParticipant.DisplayName(user.Displayname);
            _addParticipant.EmailEnabled.Should().BeFalse();
            _addParticipant.FirstnameEnabled.Should().BeFalse();
            _addParticipant.LastnameEnabled.Should().BeFalse();
            _addParticipant.GetFieldValue("phone").Should().NotBeNullOrEmpty();

            if (_addParticipant.RoleValue().Contains("Solicitor"))
            {
                AddSolicitorInformation(_context.TestData.ParticipantData.Last());
            }
            else
            {
                _context.TestData.ParticipantData.Last().HouseNumber = _addParticipant.GetFieldValue("houseNumber");
                _context.TestData.ParticipantData.Last().Street = _addParticipant.GetFieldValue("street");
                _context.TestData.ParticipantData.Last().City = _addParticipant.GetFieldValue("city");
                _context.TestData.ParticipantData.Last().County = _addParticipant.GetFieldValue("county");
                _context.TestData.ParticipantData.Last().PostCode = _addParticipant.GetFieldValue("postcode");
            }

            if (clickAdd)
            {
                _addParticipant.AddParticipantButton();
            }
        }

        private void AddNewPerson(RoleType roleType, bool clickAdd = true)
        {
            if (roleType == RoleType.Solicitor)
            {
                _context.TestData.ParticipantData.Add(new RepresentativeData());
            }
            else
            {
                _context.TestData.ParticipantData.Add(new IndividualData());
            }

            _context.TestData.ParticipantData.Last().Role = roleType;
            var participant = _context.TestData.ParticipantData.Last();
            _addParticipant.ParticipantEmail(participant.Email);
            _addParticipant.Title(participant.Title);
            _addParticipant.FirstName(participant.Firstname);
            _addParticipant.LastName(participant.Lastname);
            _addParticipant.Telephone(participant.Telephone);
            _addParticipant.DisplayName(participant.DisplayName);
            if (roleType == RoleType.Solicitor)
            {
                AddSolicitorInformation(participant);
            }
            else
            {
                AddAddress(participant);
            }

            if (clickAdd)
            {
                _addParticipant.AddParticipantButton();
            }
        }

        private void AddSolicitorInformation(ParticipantData participant)
        {
            _addParticipant.Organisation(participant.Organisation);
            _addParticipant.SolicitorReference(participant.SolicitorReference);
            _addParticipant.ClientRepresenting(participant.ClientRepresenting);
        }

        private void AddAddress(ParticipantData participant)
        {
            _addParticipant.HouseNumber(participant.HouseNumber);
            _addParticipant.Street(participant.Street);
            _addParticipant.City(participant.City);
            _addParticipant.County(participant.County);
            _addParticipant.Postcode(participant.PostCode);
        }

        public void ThenParticipantDetailAreDisplayedInTheList()
        {
            var actualResult = _addParticipant.GetAllParticipantsDetails();

            foreach (var participant in _context.TestData.ParticipantData)
            {
                var expectedParticipant = $"{participant.Title} {participant.Firstname} {participant.Lastname} {participant.Role.ToString().Replace("LIP", " LIP")}";

                if (participant.Role == RoleType.Solicitor)
                    expectedParticipant = $"{expectedParticipant}, representing {participant.ClientRepresenting}";

                actualResult.Any(x => x.Replace(Environment.NewLine, " ").Equals(expectedParticipant)).Should().BeTrue($"expected participant should match {expectedParticipant}");
            }
        }

        public void ClearInputData(ParticipantData participant)
        {
            _addParticipant.ParticipantEmail(participant.Email);
            _addParticipant.FirstName(participant.Firstname);
            _addParticipant.Telephone(participant.Telephone);
            _addParticipant.DisplayName(participant.DisplayName);
            _context.TestData.ParticipantData.Remove(participant);
        }
    }
}
