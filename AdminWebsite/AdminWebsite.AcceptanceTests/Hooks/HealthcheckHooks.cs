using AcceptanceTests.Common.Api.Healthchecks;
using AdminWebsite.AcceptanceTests.Helpers;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class HealthcheckHooks
    {
        [BeforeScenario(Order = (int)HooksSequence.HealthcheckHooks)]
        private void CheckApiHealth(TestContext context)
        {
            CheckBookingsApiHealth(context.AdminWebConfig.VhServices.BookingsApiUrl, context.Tokens.BookingsApiBearerToken);
            CheckUserApiHealth(context.AdminWebConfig.VhServices.UserApiUrl, context.Tokens.UserApiBearerToken);
            CheckVideoApiHealth(context.AdminWebConfig.VhServices.VideoApiUrl, context.Tokens.VideoApiBearerToken);
        }

        private static void CheckBookingsApiHealth(string apiUrl, string bearerToken)
        {
            new HealthcheckManager(apiUrl, bearerToken).CheckHealthOfBookingsApi();
        }
        private static void CheckUserApiHealth(string apiUrl, string bearerToken)
        {
            new HealthcheckManager(apiUrl, bearerToken).CheckHealthOfUserApi();
        }
        private static void CheckVideoApiHealth(string apiUrl, string bearerToken)
        {
            new HealthcheckManager(apiUrl, bearerToken).CheckHealthOfVideoApi();
        }
    }
}
