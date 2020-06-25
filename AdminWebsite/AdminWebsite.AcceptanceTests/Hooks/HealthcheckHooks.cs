using AcceptanceTests.Common.Api.Healthchecks;
using AdminWebsite.AcceptanceTests.Helpers;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class HealthcheckHooks
    {
        [BeforeScenario(Order = (int)HooksSequence.HealthcheckHooks)]
        public void CheckApiHealth(TestContext context)
        {
            CheckBookingsApiHealth(context.WebConfig.VhServices.BookingsApiUrl, context.Tokens.BookingsApiBearerToken);
            CheckUserApiHealth(context.WebConfig.VhServices.UserApiUrl, context.Tokens.UserApiBearerToken);
            CheckVideoApiHealth(context.WebConfig.VhServices.VideoApiUrl, context.Tokens.VideoApiBearerToken);
        }

        private static void CheckBookingsApiHealth(string apiUrl, string bearerToken)
        {
            HealthcheckManager.CheckHealthOfBookingsApi(apiUrl, bearerToken);
        }
        private static void CheckUserApiHealth(string apiUrl, string bearerToken)
        {
            HealthcheckManager.CheckHealthOfUserApi(apiUrl, bearerToken);
        }
        private static void CheckVideoApiHealth(string apiUrl, string bearerToken)
        {
            HealthcheckManager.CheckHealthOfVideoApi(apiUrl, bearerToken);
        }
    }
}
