using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public sealed class AssignClerkSteps
    {
        private readonly AssignClerk _assignClerk;

        public AssignClerkSteps(AssignClerk assignClerk)
        {
            _assignClerk = assignClerk;
        }

        [When(@"judge is assigned to hearing")]
        public void AssignClerkToHearing()
        {
            AssignClerkPage();
            SelectJudge();
        }

        [When(@"Admin user is on assign judge page")]
        [Then(@"user should be on assign judge page")]
        public void AssignClerkPage()
        {
            _assignClerk.PageUrl(PageUri.AssignJudgePage);
        }

        [When(@"select judge")]
        public void SelectJudge()
        {
            _assignClerk.Clerk();
        }

        [Given(@"hearing booking is assigned to a judge")]
        [When(@"hearing booking is assigned to a different judge")]
        public void WhenHearingBookingIsAssignedToADifferentJudge()
        {
            AssignClerkPage();
            _assignClerk.AddItems("Clerk", _assignClerk.GetSelectedClerk());
        }
    }
}