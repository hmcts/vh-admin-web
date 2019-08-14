using AdminWebsite.AcceptanceTests.Helpers;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class AssignClerk : Common
    {
        public AssignClerk(Browser browser) : base(browser)
        {
        }

        public void Clerk(string clerkName) => SelectOption(CommonLocator.List("judgeName"), clerkName);
        public string ChangeSelectedClerk() => SelectLastItem(CommonLocator.List("judgeName"));
    }
}