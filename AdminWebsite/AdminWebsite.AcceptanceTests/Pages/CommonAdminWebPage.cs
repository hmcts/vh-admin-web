using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class CommonAdminWebPage
    {
        public By DashboardLink = By.PartialLinkText("Dashboard");
        public By BookingsListLink = By.PartialLinkText("Bookings list");
        public By ContactUsLink = By.PartialLinkText("Contact us");
        public By ContactUsTitle = CommonLocators.ElementContainingText("Contact the video hearings service");
        public By ContactUsPhoneNumber(string phoneNumber) => CommonLocators.ElementContainingText(phoneNumber);
        public By ContactUsEmail(string email) => CommonLocators.ElementContainingText(email);
        public By OpenGovernmentLicenceLink = By.PartialLinkText("Open Government Licence");
    }
}
