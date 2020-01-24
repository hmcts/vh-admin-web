using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class CommonAdminWebPage
    {
        public static By DashboardLink = By.PartialLinkText("Dashboard");
        public static By BookingsListLink = By.PartialLinkText("Bookings list");
        public static By ContactUsLink = By.PartialLinkText("Contact us");
        public static By ContactUsTitle = CommonLocators.ElementContainingText("Contact the video hearings service");
        public static By ContactUsPhoneNumber(string phoneNumber) => CommonLocators.ElementContainingText(phoneNumber);
        public static By ContactUsEmail(string email) => CommonLocators.ElementContainingText(email);
        public static By OpenGovernmentLicenceLink = By.PartialLinkText("Open Government Licence");
    }
}
