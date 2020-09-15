using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class AddParticipantsPage
    {
        public static By PartyDropdown = By.Id("party");
        public static By RoleDropdown = By.Id("role");
        public static By ParticipantEmailTextfield = By.Id("participantEmail");
        public static By TitleDropdown = By.Id("title");
        public static By FirstNameTextfield = By.Id("firstName");
        public static By LastNameTextfield = By.Id("lastName");
        public static By IndividualOrganisationTextfield = By.Id("companyNameIndividual");
        public static By RepOrganisationTextfield = By.Id("companyName");
        public static By PhoneTextfield = By.Id("phone");
        public static By DisplayNameTextfield = By.Id("displayName");
        public static By ReferenceTextfield = By.Id("reference");
        public static By RepresentingTextfield = By.Id("representing");
        public static By AddParticipantLink = By.Id("addParticipantBtn");
        public static By ClearDetailsLink = By.PartialLinkText("Clear details");
        public static By NextButton = By.Id(("nextButton"));
        public static By CancelButton = By.Id("cancelButton");
        public static By ExistingEmailLinks = By.XPath("//li[@class='vk-showlist-m30']/a");
        public static By ParticipantsList = By.XPath("//*[contains(@class, 'vhtable-header')]");
        public static By InvalidEmailError = CommonLocators.ElementContainingText("Please enter a valid email address");
        public static By JudgeUserParticipantsList(string username) => CommonLocators.ElementContainingText(username);
    }
}
