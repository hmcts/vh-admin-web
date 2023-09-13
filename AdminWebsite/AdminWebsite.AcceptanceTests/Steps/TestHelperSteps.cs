using AdminWebsite.AcceptanceTests.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class TestHelperSteps
    {
        private readonly TestContext _c;

        public TestHelperSteps(TestContext testContext)
        {
            _c = testContext;
        }
    }
}
