using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class AddParticipantsPage
    {
        public By PartyDropdown = By.Id("party");
        public By RoleDropdown = By.Id("role");
        public By ParticipantEmailTextfield = By.Id("participantEmail");
        public By TitleDropdown = By.Id("title");
        public By FirstNameTextfield = By.Id("firstName");
        public By LastNameTextfield = By.Id("lastName");
        public By IndividualOrganisationTextfield = By.Id("companyNameIndividual");
        public By RepOrganisationTextfield = By.Id("companyName");
        public By PhoneTextfield = By.Id("phone");
        public By DisplayNameTextfield = By.Id("displayName");
        public By HouseNumberTextfield = By.Id("houseNumber");
        public By StreetTextfield = By.Id("street");
        public By CityTextfield = By.Id("city");
        public By CountyTextfield = By.Id("county");
        public By PostcodeTextfield = By.Id("postcode");
        public By SolicitorReferenceTextfield = By.Id("solicitorReference");
        public By RepresentingTextfield = By.Id("representing");
        public By AddParticipantLink = By.Id("addParticipantBtn");
        public By ClearDetailsLink = By.PartialLinkText("Clear details");
        public By NextButton = By.Id(("nextButton"));
        public By CancelButton = By.Id("cancelButton");
        public By ExistingEmailLinks = By.XPath("//li[@class='vk-showlist-m30']/a");
        public By ParticipantsList = By.XPath("//*[contains(@class, 'vhtable-header')]");
        public By ClerkUserParticipantsList(string username) => CommonLocators.ElementContainingText(username);
    }
}
