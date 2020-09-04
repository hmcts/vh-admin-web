﻿using System.Collections.Generic;
using System.Threading.Tasks;
using AcceptanceTests.Common.Configuration;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Data.TestData;
using AdminWebsite.AcceptanceTests.Configuration;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Data.TestData;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.TestAPI.Client;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using TechTalk.SpecFlow;
using HearingDetails = AdminWebsite.AcceptanceTests.Data.HearingDetails;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class ConfigHooks
    {
        private readonly IConfigurationRoot _configRoot;

        public ConfigHooks(TestContext context)
        {
            _configRoot = ConfigurationManager.BuildConfig("f99a3fe8-cf72-486a-b90f-b65c27da84ee", GetTargetEnvironment(), RunOnSauceLabsFromLocal());
            context.WebConfig = new AdminWebConfig();
            context.Users = new List<User>();
        }

        private static string GetTargetEnvironment()
        {
            return NUnit.Framework.TestContext.Parameters["TargetEnvironment"] ?? "";
        }

        private static bool RunOnSauceLabsFromLocal()
        {
            return NUnit.Framework.TestContext.Parameters["RunOnSauceLabs"] != null &&
                   NUnit.Framework.TestContext.Parameters["RunOnSauceLabs"].Equals("true");
        }

        [BeforeScenario(Order = (int)HooksSequence.ConfigHooks)]
        public async Task RegisterSecrets(TestContext context)
        {
            RegisterAzureSecrets(context);
            RegisterTestUserSecrets(context);
            RegisterDefaultData(context);
            RegisterHearingServices(context);
            RegisterIsLive(context);
            RegisterWowzaSettings(context);
            RegisterSauceLabsSettings(context);
            RunningAdminWebLocally(context);
            await GenerateBearerTokens(context);
        }

        private void RegisterAzureSecrets(TestContext context)
        {
            context.WebConfig.AzureAdConfiguration = Options.Create(_configRoot.GetSection("AzureAd").Get<AdminWebSecurityConfiguration>()).Value;
            ConfigurationManager.VerifyConfigValuesSet(context.WebConfig.AzureAdConfiguration);
        }

        private void RegisterTestUserSecrets(TestContext context)
        {
            context.WebConfig.TestConfig = Options.Create(_configRoot.GetSection("TestUserSecrets").Get<AdminWebTestConfig>()).Value;
            context.WebConfig.TestConfig.TargetBrowser.Should().NotBeNull();
            context.WebConfig.TestConfig.TargetDevice.Should().NotBeNull();
            context.WebConfig.TestConfig.TargetOS.Should().NotBeNull();
            context.WebConfig.TestConfig.TestUsernameStem.Should().NotBeNull();
            context.WebConfig.TestConfig.TestUserPassword.Should().NotBeNull();
        }

        private static void RegisterDefaultData(TestContext context)
        {
            context.Test = new Test
            {
                AddParticipant = new AddParticipant(),
                AssignJudge = new AssignJudge(),
                CommonData = LoadXmlFile.SerialiseCommonData(),
                HearingDetails = new HearingDetails(),
                HearingParticipants = new List<UserAccount>(),
                HearingResponse = new HearingDetailsResponse(),
                HearingSchedule = new HearingSchedule(),
                TestData = new DefaultDataManager().SerialiseTestData(),
                VideoAccessPoints = new VideoAccessPoints()
            };
            context.Test.AddParticipant = context.Test.TestData.AddParticipant;
        }

        private void RegisterHearingServices(TestContext context)
        {
            context.WebConfig.VhServices = Options.Create(_configRoot.GetSection("VhServices").Get<AdminWebVhServiceConfig>()).Value;
            ConfigurationManager.VerifyConfigValuesSet(context.WebConfig.VhServices);
        }

        private void RegisterIsLive(TestContext context)
        {
            context.WebConfig.IsLive = _configRoot.GetValue<bool>("IsLive");
            context.WebConfig.Should().NotBeNull();
        }

        private void RegisterWowzaSettings(TestContext context)
        {
            context.WebConfig.Wowza = Options.Create(_configRoot.GetSection("WowzaConfiguration").Get<WowzaConfiguration>()).Value;
            ConfigurationManager.VerifyConfigValuesSet(context.WebConfig.Wowza);
        }

        private void RegisterSauceLabsSettings(TestContext context)
        {
            context.WebConfig.SauceLabsConfiguration = Options.Create(_configRoot.GetSection("Saucelabs").Get<SauceLabsSettingsConfig>()).Value;
            if (!context.WebConfig.SauceLabsConfiguration.RunningOnSauceLabs()) return;
            context.WebConfig.SauceLabsConfiguration.SetRemoteServerUrlForDesktop(context.Test.CommonData.CommonConfig.SauceLabsServerUrl);
            context.WebConfig.SauceLabsConfiguration.AccessKey.Should().NotBeNullOrWhiteSpace();
            context.WebConfig.SauceLabsConfiguration.Username.Should().NotBeNullOrWhiteSpace();
            context.WebConfig.SauceLabsConfiguration.RealDeviceApiKey.Should().NotBeNullOrWhiteSpace();
        }

        private static void RunningAdminWebLocally(TestContext context)
        {
            context.WebConfig.VhServices.RunningAdminWebLocally = context.WebConfig.VhServices.AdminWebUrl.Contains("localhost");
        }

        private static async Task GenerateBearerTokens(TestContext context)
        {
            context.Token = await ConfigurationManager.GetBearerToken(
                context.WebConfig.AzureAdConfiguration, context.WebConfig.VhServices.TestApiResourceId);
            context.Token.Should().NotBeNullOrEmpty();
        }
    }
}
