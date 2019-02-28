using AdminWebsite.AcceptanceTests.Helpers;

namespace AdminWebsite.AcceptanceTests.Pages
{
    public class AssignJudge : Common
    {
        public AssignJudge(BrowserContext browserContext) : base(browserContext)
        {
        }
        public void Judge(string option) => SelectOption(CommonLocator.List("judgeName"), option);
    }
}