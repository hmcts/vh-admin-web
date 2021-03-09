using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Configuration;
using AdminWebsite.AcceptanceTests.Helpers;
using Notify.Client;
using System.Linq;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public class RegisterApisHooks
    {
        [BeforeScenario(Order = (int)HooksSequence.RegisterApisHooks)]
        public void RegisterApis(TestContext context)
        {
            context.Api = new TestApiManager(context.WebConfig.VhServices.TestApiUrl, context.Token);
            ConfigurationManager.VerifyConfigValuesSet(context.Api);
            context.NotifyClient = new NotificationClient(context.WebConfig.NotifyConfiguration.ApiKey);
            context.NotificationApi = new NotificationApiManager(context.WebConfig.VhServices.NotificationApiUrl, context.NotificationToken);
        }
    }
}
