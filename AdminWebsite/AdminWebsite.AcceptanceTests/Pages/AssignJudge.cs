using AdminWebsite.AcceptanceTests.Helpers;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class AssignJudge : Common
    {
        public AssignJudge(BrowserContext browserContext) : base(browserContext)
        {
        }
        public void Judge() => SelectOption(CommonLocator.List("judgeName"));
    }
}