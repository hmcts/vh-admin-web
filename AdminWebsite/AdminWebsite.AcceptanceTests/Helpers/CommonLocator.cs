using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Helpers
{
    public static class CommonLocator
    {
        public static By List(string element) => By.XPath($"//select[@id='{element}']/option[position()>1]");
    }
}