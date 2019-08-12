using AdminWebsite.AcceptanceTests.Helpers;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class AssignClerk : Common
    {
        public AssignClerk(Browser browser) : base(browser)
        {
        }
        public void Clerk() => SelectOption(CommonLocator.List("judgeName"));
        public string GetSelectedClerk() => SelectLastItem(CommonLocator.List("judgeName"));
    }
}