using AdminWebsite.AcceptanceTests.Contexts;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class AssignClerkSteps
    {
        private readonly TestContext _context;
        private readonly AssignClerk _assignClerk;

        public AssignClerkSteps(TestContext context, AssignClerk assignClerk)
        {
            _context = context;
            _assignClerk = assignClerk;
        }

        [Given(@"hearing booking is assigned to a judge")]
        [When(@"judge is assigned to hearing")]
        public void AssignClerkToHearing()
        {
            AssignClerkPage();
            SelectJudge();
        }

        [When(@"Admin user is on the assign judge page")]
        [Then(@"user should be on the assign judge page")]
        public void AssignClerkPage()
        {
            _assignClerk.PageUrl(PageUri.AssignJudgePage);
        }

        [When(@"select judge")]
        public void SelectJudge()
        {
            _assignClerk.Clerk(_context.GetClerkUser().Displayname);
        }

        [When(@"hearing booking is assigned to a different judge")]
        public void WhenHearingBookingIsAssignedToADifferentJudge()
        {
            AssignClerkPage();
            _assignClerk.AddItems("Clerk", _assignClerk.ChangeSelectedClerk());
        }
    }
}