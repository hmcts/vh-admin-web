using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Model.Participant;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using FluentAssertions;
using OpenQA.Selenium;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class AddParticipantSteps : ISteps
    {
        private const int TimeoutToRetrieveUserFromAad = 60;
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly AddParticipantsPage _addParticipantsPage;
        private string _individualDisplayName = "Representing";
        private readonly CommonSharedSteps _commonSharedSteps;
        public AddParticipantSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, AddParticipantsPage addParticipantsPage, CommonSharedSteps commonSharedSteps)
        {
            _c = testContext;
            _browsers = browsers;
            _addParticipantsPage = addParticipantsPage;
            _commonSharedSteps = commonSharedSteps;
        }

        [When(@"the user completes the add participants form")]
        public void ProgressToNextPage()
        {
            AddExistingClaimantIndividual();
            AddExistingClaimantRep();
            AddNewDefendantIndividual();
            AddNewDefendantRep();
            VerifyUsersAreAddedToTheParticipantsList();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.NextButton).Click();
        }

        private void AddExistingClaimantIndividual()
        {
            var individual = UserManager.GetIndividualUsers(_c.AdminWebConfig.UserAccounts)[0];
            individual.CaseRoleName = Party.Claimant.Name;
            individual.HearingRoleName = PartyRole.ClaimantLip.Name;
            _c.Test.HearingParticipants.Add(individual);
            SetParty(individual.CaseRoleName);
            SetRole(individual.HearingRoleName);
            SetExistingIndividualDetails(individual);
        }

        private void AddExistingClaimantRep()
        {
            var rep = UserManager.GetRepresentativeUsers(_c.AdminWebConfig.UserAccounts)[0];
            rep.CaseRoleName = Party.Claimant.Name;
            rep.HearingRoleName = PartyRole.Solicitor.Name;
            _c.Test.HearingParticipants.Add(rep);
            SetParty(rep.CaseRoleName);
            SetRole(rep.HearingRoleName);
            SetExistingRepDetails(rep);
        }

        private void AddExistingDefendantIndividual()
        {
            var individual = UserManager.GetIndividualUsers(_c.AdminWebConfig.UserAccounts)[1];
            individual.CaseRoleName = Party.Defendant.Name;
            individual.HearingRoleName = PartyRole.DefendantLip.Name;
            _c.Test.HearingParticipants.Add(individual);
            SetParty(individual.CaseRoleName);
            SetRole(individual.HearingRoleName);
            SetExistingIndividualDetails(individual);
        }

        private void AddExistingDefendantRep()
        {
            var rep = UserManager.GetRepresentativeUsers(_c.AdminWebConfig.UserAccounts)[1];
            rep.CaseRoleName = Party.Defendant.Name;
            rep.HearingRoleName = PartyRole.Solicitor.Name;
            _c.Test.HearingParticipants.Add(rep);
            SetParty(rep.CaseRoleName);
            SetRole(rep.HearingRoleName);
            SetExistingRepDetails(rep);
        }

        private void AddNewClaimantIndividual()
        {
            var individual = CreateNewUser("Individual");
            individual.CaseRoleName = Party.Claimant.Name;
            individual.HearingRoleName = PartyRole.ClaimantLip.Name;
            _individualDisplayName = individual.DisplayName;
            _c.Test.HearingParticipants.Add(individual);
            SetParty(individual.CaseRoleName);
            SetRole(individual.HearingRoleName);
            SetNewIndividualDetails(individual);
        }

        private void AddNewClaimantRep()
        {
            var rep = CreateNewUser("Representative");
            rep.CaseRoleName = Party.Claimant.Name;
            rep.HearingRoleName = PartyRole.Solicitor.Name;
            rep.Representee = _individualDisplayName;
            _c.Test.HearingParticipants.Add(rep);
            SetParty(rep.CaseRoleName);
            SetRole(rep.HearingRoleName);
            SetNewRepDetails(rep);
        }

        private void AddNewDefendantIndividual()
        {

            var individual = CreateNewUser("Individual");
            individual.CaseRoleName = Party.Defendant.Name;
            individual.HearingRoleName = PartyRole.DefendantLip.Name;
            _individualDisplayName = individual.DisplayName;
            _c.Test.HearingParticipants.Add(individual);
            SetParty(individual.CaseRoleName);
            SetRole(individual.HearingRoleName);
            SetNewIndividualDetails(individual);
        }

        private void AddNewDefendantRep()
        {
            var rep = CreateNewUser("Representative");
            rep.CaseRoleName = Party.Defendant.Name;
            rep.HearingRoleName = PartyRole.Solicitor.Name;
            rep.Representee = _individualDisplayName;
            _c.Test.HearingParticipants.Add(rep);
            SetParty(rep.CaseRoleName);
            SetRole(rep.HearingRoleName);
            SetNewRepDetails(rep);
        }

        private void SetParty(string party)
        {
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser.Key].Driver, _addParticipantsPage.PartyDropdown, Party.FromString(party).Name);
        }

        private void SetRole(string role)
        {
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser.Key].Driver, _addParticipantsPage.RoleDropdown, PartyRole.FromString(role).Name);
        }

        private UserAccount CreateNewUser(string role)
        {
            var user = new UserAccount();
            var prefix = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Participant.NewUserPrefix;
            user.AlternativeEmail = $"{prefix}{Faker.Internet.Email()}";
            var firstname = Faker.Name.First();
            var lastname = Faker.Name.Last();
            var displayName = $"{firstname} {lastname}";
            user.Firstname = $"{prefix}{firstname}";
            user.Lastname = $"{lastname}";
            user.DisplayName = $"{prefix}{displayName}";
            user.Role = role;
            user.Username = $"{user.Firstname.ToLower()}.{user.Lastname.ToLower()}{_c.AdminWebConfig.TestConfig.TestUsernameStem.ToLower()}";
            return user;
        }

        private void SetNewIndividualDetails(UserAccount user)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.ParticipantEmailTextfield).SendKeys(user.AlternativeEmail);
            var title = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Participant.Title;
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser.Key].Driver, _addParticipantsPage.TitleDropdown, title);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.FirstNameTextfield).SendKeys(user.Firstname);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.LastNameTextfield).SendKeys(user.Lastname);
            var organisation = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Participant.Organisation;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.IndividualOrganisationTextfield).SendKeys(organisation);
            var telephone = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Participant.Phone;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.PhoneTextfield).SendKeys(telephone);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.DisplayNameTextfield).SendKeys(user.DisplayName);
            var houseNumber = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Address.HouseNumber;
            EnterTextIfFieldIsNotPrePopulated(_addParticipantsPage.HouseNumberTextfield, houseNumber);
            var street = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Address.Street;
            EnterTextIfFieldIsNotPrePopulated(_addParticipantsPage.StreetTextfield, street);
            var city = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Address.Street;
            EnterTextIfFieldIsNotPrePopulated(_addParticipantsPage.CityTextfield, city);
            var county = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Address.County;
            EnterTextIfFieldIsNotPrePopulated(_addParticipantsPage.CountyTextfield, county);
            var postcode = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Address.Postcode;
            EnterTextIfFieldIsNotPrePopulated(_addParticipantsPage.PostcodeTextfield, postcode);
            _browsers[_c.CurrentUser.Key].ScrollTo(_addParticipantsPage.AddParticipantLink);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementClickable(_addParticipantsPage.AddParticipantLink).Click();
        }

        private void EnterTextIfFieldIsNotPrePopulated(By element, string value)
        {
            if (_browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(element).GetAttribute("value").Length.Equals(0))
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(element).SendKeys(value);
            }
        }

        private void SetNewRepDetails(UserAccount user)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.ParticipantEmailTextfield).SendKeys(user.AlternativeEmail);
            var title = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Participant.Title;
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser.Key].Driver, _addParticipantsPage.TitleDropdown, title);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.FirstNameTextfield).SendKeys(user.Firstname);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.LastNameTextfield).SendKeys(user.Lastname);
            var telephone = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Participant.Phone;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.PhoneTextfield).SendKeys(telephone);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.DisplayNameTextfield).SendKeys(user.DisplayName);
            var organisation = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Participant.Organisation;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.RepOrganisationTextfield).SendKeys(organisation);
            var solicitorsReference = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Participant.SolicitorsReference;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.SolicitorReferenceTextfield).SendKeys(solicitorsReference);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.RepresentingTextfield).SendKeys(user.Representee);
            _browsers[_c.CurrentUser.Key].ScrollTo(_addParticipantsPage.AddParticipantLink);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementClickable(_addParticipantsPage.AddParticipantLink).Click();
        }

        private void SetExistingIndividualDetails(UserAccount user)
        {
            ExistingUserEmailIsSelected(user.AlternativeEmail).Should().BeTrue("Existing user email appeared in the dropdown list retrieved from AAD");
            IndividualFieldsAreSet(user);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.DisplayNameTextfield).SendKeys(user.DisplayName);
            _browsers[_c.CurrentUser.Key].ScrollTo(_addParticipantsPage.AddParticipantLink);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementClickable(_addParticipantsPage.AddParticipantLink).Click();
        }

        private void SetExistingRepDetails(UserAccount user)
        {
            ExistingUserEmailIsSelected(user.AlternativeEmail).Should().BeTrue("Existing user email appeared in the dropdown list retrieved from AAD");
            RepFieldsAreSet(user);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.DisplayNameTextfield).SendKeys(user.DisplayName);
            var organisation = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Participant.Organisation;
            EnterTextIfFieldIsNotPrePopulated(_addParticipantsPage.RepOrganisationTextfield, organisation);
            var solicitorsReference = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Participant.SolicitorsReference;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.SolicitorReferenceTextfield).SendKeys(solicitorsReference);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.RepresentingTextfield).SendKeys(user.Representee);
            _browsers[_c.CurrentUser.Key].ScrollTo(_addParticipantsPage.AddParticipantLink);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementClickable(_addParticipantsPage.AddParticipantLink).Click();
        }

        private bool ExistingUserEmailIsSelected(string alternativeEmail)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.ParticipantEmailTextfield).SendKeys(alternativeEmail);
            var retrievedListOfEmails = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(_addParticipantsPage.ExistingEmailLinks, TimeoutToRetrieveUserFromAad);
            retrievedListOfEmails.Count.Should().BeGreaterThan(0);
            foreach (var email in retrievedListOfEmails)
            {
                if (!email.Text.ToLower().Contains(alternativeEmail.ToLower())) continue;
                email.Click();
                return true;
            }

            return false;
        }

        private void IndividualFieldsAreSet(UserAccount user)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.ParticipantEmailTextfield).Enabled.Should().BeFalse();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.FirstNameTextfield).Enabled.Should().BeFalse();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.LastNameTextfield).Enabled.Should().BeFalse();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.ParticipantEmailTextfield).GetAttribute("value").Should().Be(user.AlternativeEmail);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.FirstNameTextfield).GetAttribute("value").Should().Be(user.Firstname);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.LastNameTextfield).GetAttribute("value").Should().Be(user.Lastname);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.PhoneTextfield).GetAttribute("value").Should().NotBeNullOrWhiteSpace();
            var organisation = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Participant.Organisation;
            EnterTextIfFieldIsNotPrePopulated(_addParticipantsPage.IndividualOrganisationTextfield, organisation);
            var houseNumber = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Address.HouseNumber;
            EnterTextIfFieldIsNotPrePopulated(_addParticipantsPage.HouseNumberTextfield, houseNumber);
            var street = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Address.Street;
            EnterTextIfFieldIsNotPrePopulated(_addParticipantsPage.StreetTextfield, street);
            var city = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Address.Street;
            EnterTextIfFieldIsNotPrePopulated(_addParticipantsPage.CityTextfield, city);
            var county = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Address.County;
            EnterTextIfFieldIsNotPrePopulated(_addParticipantsPage.CountyTextfield, county);
            var postcode = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Address.Postcode;
            EnterTextIfFieldIsNotPrePopulated(_addParticipantsPage.PostcodeTextfield, postcode);
        }

        private void RepFieldsAreSet(UserAccount user)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.ParticipantEmailTextfield).Enabled.Should().BeFalse();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.FirstNameTextfield).Enabled.Should().BeFalse();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.LastNameTextfield).Enabled.Should().BeFalse();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.ParticipantEmailTextfield).GetAttribute("value").Should().Be(user.AlternativeEmail);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.FirstNameTextfield).GetAttribute("value").Should().Be(user.Firstname);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.LastNameTextfield).GetAttribute("value").Should().Be(user.Lastname);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.PhoneTextfield).GetAttribute("value").Should().NotBeNullOrWhiteSpace();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(_addParticipantsPage.RepOrganisationTextfield).GetAttribute("value").Should().NotBeNullOrWhiteSpace();
        }

        private void VerifyUsersAreAddedToTheParticipantsList()
        {
            var clerk = UserManager.GetClerkUser(_c.AdminWebConfig.UserAccounts);
            _browsers[_c.CurrentUser.Key].Driver
                .WaitUntilVisible(_addParticipantsPage.ClerkUserParticipantsList(clerk.Username))
                .Displayed.Should().BeTrue();

            var actualResult = GetAllParticipantsDetails();
            var title = _c.AdminWebConfig.TestConfig.TestData.AddParticipant.Participant.Title;

            foreach (var participant in _c.Test.HearingParticipants)
            {
                if (participant.Role.ToLower().Equals("clerk") || participant.Role.ToLower().Equals("judge")) continue;
                var expectedParticipant =
                    $"{title} {participant.Firstname} {participant.Lastname} {participant.HearingRoleName}";

                if (participant.HearingRoleName == PartyRole.Solicitor.Name)
                    expectedParticipant = $"{expectedParticipant}, representing {participant.Representee}";

                actualResult.Any(x => x.Replace(Environment.NewLine, " ").Equals(expectedParticipant)).Should()
                    .BeTrue($"expected participant matches {expectedParticipant}");
            }
        }

        public List<string> GetAllParticipantsDetails()
        {
            var elements = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(_addParticipantsPage.ParticipantsList);
            return elements.Select(element => element.Text.Trim().Replace("\r\n", " ")).ToList();
        }
    }
}
