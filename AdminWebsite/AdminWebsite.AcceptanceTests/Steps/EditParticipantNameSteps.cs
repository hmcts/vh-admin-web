using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.TestAPI.Client;
using FluentAssertions;
using System.Collections.Generic;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class EditParticipantNameSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;
        private User _participant;

        public EditParticipantNameSteps(TestContext c, Dictionary<User, UserBrowser> browsers)
        {
            _c = c;
            _browsers = browsers;
            _participant = Users.GetIndividualUser(_c.Users); 
        }

        [When(@"I search for the participant by contact email")]
        public void WhenISearchForTheParticipantByContactEmail()
        {
            SearchParticipantBy(_participant.Contact_email);
        }

        [When(@"I search for a user that does not exists")]
        public void WhenISearchForAUserThatDoesNotExists()
        {
            SearchParticipantBy("user@notexists.com");
        }

        [When(@"I search for a Judge user account")]
        public void WhenISearchForAJudgeUserAccount()
        {
            _participant = Users.GetJudgeUser(_c.Users);
            SearchParticipantBy(_participant.Contact_email);
        }

        [When(@"then update First and Last Name")]
        public void WhenThenUpdateFirstAndLastName()
        {
            var emailLink = EditParticipantNamePage.ContactEmailLink(_participant.Contact_email);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(emailLink);
            _browsers[_c.CurrentUser].Click(emailLink);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(EditParticipantNamePage.FirstNameField).Clear();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(EditParticipantNamePage.FirstNameField).SendKeys(_participant.First_name);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(EditParticipantNamePage.LastNameField).Clear();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(EditParticipantNamePage.LastNameField).SendKeys(_participant.Last_name);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(EditParticipantNamePage.SaveButton);
            _browsers[_c.CurrentUser].Click(EditParticipantNamePage.SaveButton);
        }

        [Then(@"the pariticpant's details are updated")]
        public void ThenThePariticpantSDetailsAreUpdated()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(EditParticipantNamePage.CompleteSignField).Text.ToLower().Trim().Should().Be(EditParticipantNamePage.CompleteSignText);
        }

        [Then(@"the pariticpant's details are retrieved")]
        public void ThenThePariticpantSDetailsAreRetrieved()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(EditParticipantNamePage.FullNameField).Text.Trim().Should().Be(_participant.Display_name);
        }

        [Then(@"the user does not exists message is displayed")]
        public void ThenTheUserDoesNotExistsMessageIsDisplayed()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(EditParticipantNamePage.UserNotFounMessage).Displayed.Should().BeTrue();
        }
        
        [Then(@"the user is not allowed to be edited message is displayed")]
        public void ThenTheUserIsNotAllowedToBeEditedMessageIsDisplayed()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(EditParticipantNamePage.JudgeNotAllowedToBeEditedMessage).Displayed.Should().BeTrue();
        }

        private void SearchParticipantBy(string contactEmail)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(EditParticipantNamePage.ContactEmailTextField).SendKeys(contactEmail);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementClickable(EditParticipantNamePage.SubmitButton);
            _browsers[_c.CurrentUser].Click(EditParticipantNamePage.SubmitButton);

        }

    }
}
