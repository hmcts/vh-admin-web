using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Model.Participant;
using AcceptanceTests.Common.Test.Steps;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.TestAPI.Client;
using FluentAssertions;
using OpenQA.Selenium;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class AddParticipantSteps : ISteps
    {
        private const int TimeoutToRetrieveUserFromAad = 60;
        private const string RepresentingText = "Representing";
        private const string InterpreterText = "Interpreting for";
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;
        private string _individualDisplayName = RepresentingText;
        private readonly CommonSharedSteps _commonSharedSteps;
        public AddParticipantSteps(TestContext testContext, Dictionary<User, UserBrowser> browsers, CommonSharedSteps commonSharedSteps)
        {
            _c = testContext;
            _browsers = browsers;
            _commonSharedSteps = commonSharedSteps;
        }

        [When(@"the user completes the add participants form")]
        public void ProgressToNextPage()
        {
            AddExistingClaimantIndividual();
            AddExistingClaimantRep();
            AddNewDefendantIndividual(PartyRole.LitigantInPerson);
            AddNewDefendantRep();
            VerifyUsersAreAddedToTheParticipantsList();
            ClickNext();
        }

        [When(@"the user completes the add participants form with an Interpreter")]
        public void WhenTheUserCompletesTheAddParticipantsFormWithAnInterpreter()
        {
            AddNewDefendantIndividual(PartyRole.LitigantInPerson);
            AddNewDefendantIndividual(PartyRole.Interpreter);
            AddExistingClaimantIndividual();
            VerifyUsersAreAddedToTheParticipantsList();
            ClickNext();
        }

        public void ClickNext()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.NextButton);
            _browsers[_c.CurrentUser].Click(AddParticipantsPage.NextButton);
        }

        private void AddExistingClaimantIndividual()
        {
            var individualUser = Users.GetIndividualUser(_c.Users);
            var individual = UserToUserAccountMapper.Map(individualUser);
            individual.CaseRoleName = Party.Claimant.Name;
            individual.HearingRoleName = PartyRole.LitigantInPerson.Name;
            _c.Test.HearingParticipants.Add(individual);
            SetParty(individual.CaseRoleName);
            SetRole(individual.HearingRoleName);
            SetExistingIndividualDetails(individual);
        }

        private void AddExistingClaimantRep()
        {
            var repUser = Users.GetRepresentativeUser(_c.Users);
            var rep = UserToUserAccountMapper.Map(repUser);
            rep.CaseRoleName = Party.Claimant.Name;
            rep.HearingRoleName = PartyRole.Representative.Name;
            rep.Representee = _c.Users.First(x => x.User_type == UserType.Individual).Display_name;
            _c.Test.HearingParticipants.Add(rep);
            SetParty(rep.CaseRoleName);
            SetRole(rep.HearingRoleName);
            SetExistingRepDetails(rep);
        }

        private void AddNewDefendantIndividual(PartyRole partyRole)
        {
            var individual = CreateNewUser("Individual");
            individual.CaseRoleName = Party.Defendant.Name;
            individual.HearingRoleName = partyRole.Name;
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
            rep.HearingRoleName = PartyRole.Representative.Name;
            rep.Representee = _individualDisplayName;
            _c.Test.HearingParticipants.Add(rep);
            SetParty(rep.CaseRoleName);
            SetRole(rep.HearingRoleName);
            SetNewRepDetails(rep);
        }

        private void SetParty(string party)
        {
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver, AddParticipantsPage.PartyDropdown, Party.FromString(party).Name);
        }

        private void SetRole(string role)
        {
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver, AddParticipantsPage.RoleDropdown, PartyRole.FromString(role).Name);
        }

        private UserAccount CreateNewUser(string role)
        {
            var user = new UserAccount();
            var prefix = _c.Test.TestData.AddParticipant.Participant.NewUserPrefix;
            user.AlternativeEmail = $"{prefix}{Faker.RandomNumber.Next()}@hmcts.net";
            var firstname = Faker.Name.First();
            var lastname = Faker.Name.Last();
            var displayName = $"{firstname} {lastname}";
            user.Firstname = $"{prefix}{firstname}";
            user.Lastname = $"{lastname}";
            user.DisplayName = $"{prefix}{displayName}";
            user.Role = role;
            user.Username = $"{user.Firstname.ToLower()}.{user.Lastname.ToLower()}{_c.WebConfig.TestConfig.TestUsernameStem.ToLower()}";
            return user;
        }

        private void SetNewIndividualDetails(UserAccount user)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.ParticipantEmailTextfield).SendKeys(user.AlternativeEmail);
            var title = _c.Test.TestData.AddParticipant.Participant.Title;
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver, AddParticipantsPage.TitleDropdown, title);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.FirstNameTextfield).SendKeys(user.Firstname);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.LastNameTextfield).SendKeys(user.Lastname);
            var organisation = _c.Test.TestData.AddParticipant.Participant.Organisation;
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.IndividualOrganisationTextfield).SendKeys(organisation);
            var telephone = _c.Test.TestData.AddParticipant.Participant.Phone;
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.PhoneTextfield).SendKeys(telephone);
            if (user.HearingRoleName == PartyRole.Interpreter.Name)
            {
                var citizen = _c.Test.HearingParticipants.First(p => p.HearingRoleName == PartyRole.LitigantInPerson.Name);
                _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver,
                    AddParticipantsPage.InterpreteeDropdown, citizen.DisplayName);
                user.Interpretee = citizen.DisplayName;
            }
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.DisplayNameTextfield).SendKeys(user.DisplayName);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.AddParticipantLink);
            _browsers[_c.CurrentUser].ScrollTo(AddParticipantsPage.AddParticipantLink);
            _browsers[_c.CurrentUser].ClickLink(AddParticipantsPage.AddParticipantLink);
        }

        private void EnterTextIfFieldIsNotPrePopulated(By element, string value)
        {
            if (_browsers[_c.CurrentUser].Driver.WaitUntilVisible(element).GetAttribute("value").Length.Equals(0))
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(element).SendKeys(value);
        }

        private void SetNewRepDetails(UserAccount user)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.ParticipantEmailTextfield).SendKeys(user.AlternativeEmail);
            var title = _c.Test.TestData.AddParticipant.Participant.Title;
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver, AddParticipantsPage.TitleDropdown, title);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.FirstNameTextfield).SendKeys(user.Firstname);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.LastNameTextfield).SendKeys(user.Lastname);
            var telephone = _c.Test.TestData.AddParticipant.Participant.Phone;
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.PhoneTextfield).SendKeys(telephone);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.DisplayNameTextfield).SendKeys(user.DisplayName);
            var organisation = _c.Test.TestData.AddParticipant.Participant.Organisation;
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.RepOrganisationTextfield).SendKeys(organisation);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.RepresentingTextfield).SendKeys(user.Representee);

            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.AddParticipantLink);
            _browsers[_c.CurrentUser].ScrollTo(AddParticipantsPage.AddParticipantLink);
            _browsers[_c.CurrentUser].ClickLink(AddParticipantsPage.AddParticipantLink);
        }

        private void SetExistingIndividualDetails(UserAccount user)
        {
            ExistingUserEmailIsSelected(user.AlternativeEmail).Should().BeTrue("Existing user email appeared in the dropdown list retrieved from AAD");
            IndividualFieldsAreSet(user);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.DisplayNameTextfield).SendKeys(user.DisplayName);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.AddParticipantLink);
            _browsers[_c.CurrentUser].ScrollTo(AddParticipantsPage.AddParticipantLink);
            Thread.Sleep(TimeSpan.FromSeconds(1));
            _browsers[_c.CurrentUser].ClickLink(AddParticipantsPage.AddParticipantLink);
        }

        private void SetExistingRepDetails(UserAccount user)
        {
            ExistingUserEmailIsSelected(user.AlternativeEmail).Should().BeTrue("Existing user email appeared in the dropdown list retrieved from AAD");
            RepFieldsAreSet(user);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.DisplayNameTextfield).SendKeys(user.DisplayName);
            var organisation = _c.Test.TestData.AddParticipant.Participant.Organisation;
            EnterTextIfFieldIsNotPrePopulated(AddParticipantsPage.RepOrganisationTextfield, organisation);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.RepresentingTextfield).SendKeys(user.Representee);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.AddParticipantLink);
            _browsers[_c.CurrentUser].ScrollTo(AddParticipantsPage.AddParticipantLink);
            Thread.Sleep(TimeSpan.FromSeconds(1));
            _browsers[_c.CurrentUser].ClickLink(AddParticipantsPage.AddParticipantLink);
        }

        private bool ExistingUserEmailIsSelected(string alternativeEmail)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.ParticipantEmailTextfield).SendKeys(alternativeEmail);
            var retrievedListOfEmails = _browsers[_c.CurrentUser].Driver.WaitUntilElementsVisible(AddParticipantsPage.ExistingEmailLinks, TimeoutToRetrieveUserFromAad);
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
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.ParticipantEmailTextfield).Enabled.Should().BeFalse();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.FirstNameTextfield).Enabled.Should().BeFalse();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.LastNameTextfield).Enabled.Should().BeFalse();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.ParticipantEmailTextfield).GetAttribute("value").Should().Be(user.AlternativeEmail);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.FirstNameTextfield).GetAttribute("value").Should().Be(user.Firstname);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.LastNameTextfield).GetAttribute("value").Should().Be(user.Lastname);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.PhoneTextfield).GetAttribute("value").Should().NotBeNullOrWhiteSpace();
            var organisation = _c.Test.TestData.AddParticipant.Participant.Organisation;
            EnterTextIfFieldIsNotPrePopulated(AddParticipantsPage.IndividualOrganisationTextfield, organisation);
        }

        private void RepFieldsAreSet(UserAccount user)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.ParticipantEmailTextfield).Enabled.Should().BeFalse();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.FirstNameTextfield).Enabled.Should().BeFalse();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.LastNameTextfield).Enabled.Should().BeFalse();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.ParticipantEmailTextfield).GetAttribute("value").Should().Be(user.AlternativeEmail);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.FirstNameTextfield).GetAttribute("value").Should().Be(user.Firstname);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.LastNameTextfield).GetAttribute("value").Should().Be(user.Lastname);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.PhoneTextfield).GetAttribute("value").Should().NotBeNullOrWhiteSpace();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.RepOrganisationTextfield).GetAttribute("value").Should().NotBeNullOrWhiteSpace();
        }

        private void VerifyUsersAreAddedToTheParticipantsList()
        {
            var judge = Users.GetJudgeUser(_c.Users);
            _browsers[_c.CurrentUser].Driver
                .WaitUntilVisible(AddParticipantsPage.JudgeUserParticipantsList(judge.Username))
                .Displayed.Should().BeTrue();

            var actualResult = GetAllParticipantsDetails();
            var title = _c.Test.TestData.AddParticipant.Participant.Title;

            foreach (var participant in _c.Test.HearingParticipants)
            {
                if (participant.Role.ToLower().Equals("judge") || participant.Role.ToLower().Equals("judge")) continue;

                var fullNameTitle = $"{title} {participant.Firstname} {participant.Lastname}";
                var expectedParticipant = $"{fullNameTitle} {participant.CaseRoleName}";

                if (participant.HearingRoleName == PartyRole.Representative.Name)
                {
                    expectedParticipant = $"{fullNameTitle} {RepresentingText} {participant.Representee} {participant.CaseRoleName}";
                }
                if (participant.HearingRoleName == PartyRole.Interpreter.Name)
                {
                    expectedParticipant = $"{fullNameTitle} {InterpreterText} {participant.Interpretee} {participant.CaseRoleName}";
                }

                actualResult.Any(x => x.Replace(Environment.NewLine, " ").Equals(expectedParticipant)).Should()
                    .BeTrue($"expected participant matches {expectedParticipant}");
            }
        }

        public List<string> GetAllParticipantsDetails()
        {
            var elements = _browsers[_c.CurrentUser].Driver.WaitUntilElementsVisible(AddParticipantsPage.ParticipantsList);
            return elements.Select(element => element.Text.Trim().Replace("\r\n", " ")).ToList();
        }

        public void EditANewParticipant(string alternativeEmail)
        {
            var user = GetParticipantByEmailAndUpdateDisplayName(alternativeEmail);
            _browsers[_c.CurrentUser].Clear(AddParticipantsPage.DisplayNameTextfield);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.DisplayNameTextfield).SendKeys(user.DisplayName);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.NextButton);
            _browsers[_c.CurrentUser].ScrollTo(AddParticipantsPage.NextButton);
            _browsers[_c.CurrentUser].Click(AddParticipantsPage.NextButton);
        }

        public void EditAnInterpreter(string alternativeEmail)
        {
            var user = GetParticipantByEmailAndUpdateDisplayName(alternativeEmail);
            
            _browsers[_c.CurrentUser].Clear(AddParticipantsPage.DisplayNameTextfield);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.DisplayNameTextfield).SendKeys(user.DisplayName);
            var citizen = _c.Test.HearingParticipants.FirstOrDefault(p => p.DisplayName != user.Interpretee && p.HearingRoleName == PartyRole.LitigantInPerson.Name);
            _commonSharedSteps.WhenTheUserSelectsTheOptionFromTheDropdown(_browsers[_c.CurrentUser].Driver,
                AddParticipantsPage.InterpreteeDropdown, citizen.DisplayName);
            user.Interpretee = citizen.DisplayName;
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.NextButton);
            _browsers[_c.CurrentUser].ScrollTo(AddParticipantsPage.NextButton);
            _browsers[_c.CurrentUser].Click(AddParticipantsPage.NextButton);
        }

        private UserAccount GetParticipantByEmailAndUpdateDisplayName(string alternativeEmail)
        {
            var user = _c.Test.HearingParticipants.First(x => x.AlternativeEmail.ToLower().Equals(alternativeEmail.ToLower()));
            user.DisplayName = $"{_c.Test.AddParticipant.Participant.NewUserPrefix}Updated display name";
            return user;
        }

        [When(@"the user attempts to add a participant with a reform email")]
        public void WhenTheUserAttemptsToAddAParticipantWithAReformEmail()
        {
            var individualUser = Users.GetIndividualUser(_c.Users);
            var individual = UserToUserAccountMapper.Map(individualUser);
            individual.CaseRoleName = Party.Claimant.Name;
            individual.HearingRoleName = PartyRole.LitigantInPerson.Name;
            _c.Test.HearingParticipants.Add(individual);
            SetParty(individual.CaseRoleName);
            SetRole(individual.HearingRoleName);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.ParticipantEmailTextfield).SendKeys(individual.Username);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.ParticipantEmailTextfield).SendKeys(Keys.Tab);
        }

        [Then(@"an error message is displayed for the invalid email")]
        public void ThenAnErrorMessageIsDisplayedForTheInvalidEmail()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AddParticipantsPage.InvalidEmailError).Displayed.Should().BeTrue();
        }

        [Then(@"audio recording is selected by default with options (.*)")]
        public void ThenAudioRecordingIsSelectedByDefaultWithOptions(string option)
        {
            var enabled = option != "disabled";
            if (!enabled)
            {
               _browsers[_c.CurrentUser].Driver.WaitUntilVisible(OtherInformationPage.AudioRecordingInterpreterMessage).Displayed.Should().BeTrue();
            }

            _browsers[_c.CurrentUser].Driver.FindElement(OtherInformationPage.AudioRecordYesRadioButton).Selected.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.FindElement(OtherInformationPage.AudioRecordYesRadioButton).Enabled.Should().Be(enabled); 
        }



    }
}
