﻿using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Configuration;
using AdminWebsite.AcceptanceTests.Helpers;
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
        }
    }
}
