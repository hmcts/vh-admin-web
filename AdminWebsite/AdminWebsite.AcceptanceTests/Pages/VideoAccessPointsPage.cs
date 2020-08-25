using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class VideoAccessPointsPage
    {
        public static By DisplayNameField = By.Id("displayName0");
        public static By AddAnotherButton = By.Id("addEndpoint"); 
        public static By NextButton = By.Id("nextButton");
        public static By CancelButton = By.Id("cancelButton");
    }
}
