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
        }

        [When(@"I search for '(.*)' by contact email")]
        public void WhenISearchForTheParticipantByContactEmail(string userType)
        {            
            SearchParticipantBy(userType);
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

        private void SearchParticipantBy(string userType)
        {
            var contactEmail = GetParticipantEmail(userType);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(EditParticipantNamePage.ContactEmailTextField).SendKeys(contactEmail);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementClickable(EditParticipantNamePage.SubmitButton);
            _browsers[_c.CurrentUser].Click(EditParticipantNamePage.SubmitButton);

        }

        private string GetParticipantEmail(string userType)
        {
            switch(userType)
            {
                case "Individual":
                    _participant = Users.GetIndividualUser(_c.Users);
                    break;
                case "Representative":
                    _participant = Users.GetRepresentativeUser(_c.Users);
                    break;
                case "PanelMember":
                    _participant = Users.GetPanelMemberUser(_c.Users);
                    break;
                case "Judge":
                    _participant = Users.GetJudgeUser(_c.Users);
                    break;
                default:
                    _participant = null;
                    break;
            } 
            
            return _participant == null ? "user@notexists.com": _participant.Contact_email;
        }

    }
}
