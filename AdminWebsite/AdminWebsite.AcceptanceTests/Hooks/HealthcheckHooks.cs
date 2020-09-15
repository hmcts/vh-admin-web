using System.Net;
using AdminWebsite.AcceptanceTests.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class HealthcheckHooks
    {
        [BeforeScenario(Order = (int)HooksSequence.HealthcheckHooks)]
        public void CheckApiHealth(TestContext context)
        {
            var response = context.Api.HealthCheck();
            response.StatusCode.Should().Be(HttpStatusCode.OK,
                $"Healthcheck failed with '{response.StatusCode}' and error message '{response.ErrorMessage}'");
        }
    }
}
