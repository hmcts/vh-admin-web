using OpenQA.Selenium;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public static class BookingsListPage
    {
        public static By Rows = By.XPath("//div[contains(@class,'vh-a')]");
        public static By Row(string caseNumber) => By.XPath($"//div[contains(text(),'{caseNumber}')]/parent::div/parent::div");
        public static By RowWithId(string id) => By.Id(id);
        public static By ScheduledTime(string id) => By.XPath($"//div[@id='{id}']//div[contains(text(),':')]");
        public static By ScheduledDuration(string id) => By.XPath($"//div[@id='{id}']//div[contains(text(),'listed for')]");
        public static By CaseNumber(string id, string caseNumber) => CaseInfo(id, caseNumber);
        public static By CaseName(string id, string caseName) => CaseInfo(id, caseName);
        public static By CaseType(string id, string caseType) => CaseInfo(id, caseType);
        public static By Judge(string id, string judge) => CaseInfo(id, judge);
        public static By Venue(string id, string venue) => CaseInfo(id, venue);
        public static By CreatedBy(string id, string createdBy) => By.XPath($"//div[@id='{id}']//div[contains(text(),'{createdBy}')]");

        private static By CaseInfo(string id, string info)
        {
            return By.XPath($"//div[@id='{id}']//div[contains(text(),'{info}')]");
        }
    }
}
