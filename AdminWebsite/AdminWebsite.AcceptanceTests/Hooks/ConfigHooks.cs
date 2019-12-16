﻿using System.Collections.Generic;
using AcceptanceTests.Common.Configuration;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Data.TestData;
using AdminWebsite.AcceptanceTests.Configuration;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Data.TestData;
using AdminWebsite.AcceptanceTests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class ConfigHooks
    {
        private readonly IConfigurationRoot _configRoot;

        public ConfigHooks(TestContext context)
        {
            _configRoot = new ConfigurationManager("f99a3fe8-cf72-486a-b90f-b65c27da84ee").BuildConfig();
            context.AdminWebConfig = new AdminWebConfig { UserAccounts = new List<UserAccount>() };
            context.Tokens = new AdminWebTokens();
        }

        [BeforeScenario(Order = (int)HooksSequence.ConfigHooks)]
        private void RegisterSecrets(TestContext context)
        {
            RegisterAzureSecrets(context);
            RegisterTestUserSecrets(context);
            RegisterTestUsers(context);
            RegisterHearingServices(context);
            RegisterSauceLabsSettings(context);
            RunningAdminWebLocally(context);
            GenerateBearerTokens(context);
        }

        private void RegisterAzureSecrets(TestContext context)
        {
            context.AdminWebConfig.AzureAdConfiguration = Options.Create(_configRoot.GetSection("AzureAd").Get<AdminWebSecurityConfiguration>()).Value;
            ConfigurationManager.VerifyConfigValuesSet(context.AdminWebConfig.AzureAdConfiguration).Should().BeTrue();
        }

        private void RegisterTestUserSecrets(TestContext context)
        {
            context.AdminWebConfig.TestConfig = Options.Create(_configRoot.GetSection("TestUserSecrets").Get<AdminWebTestConfig>()).Value;
            context.AdminWebConfig.TestConfig.CommonData = new LoadXmlFile().SerialiseCommonData();
            context.AdminWebConfig.TestConfig.TestData = new DefaultDataManager().SerialiseTestData();
            ConfigurationManager.VerifyConfigValuesSet(context.AdminWebConfig.TestConfig).Should().BeTrue();
        }

        private void RegisterTestUsers(TestContext context)
        {
            context.Test = new Test { HearingParticipants = new List<UserAccount>(), Hearing = new Hearing() };
            context.AdminWebConfig.UserAccounts = Options.Create(_configRoot.GetSection("UserAccounts").Get<List<UserAccount>>()).Value;
            context.AdminWebConfig.UserAccounts.Should().NotBeNullOrEmpty();
            foreach (var user in context.AdminWebConfig.UserAccounts)
            {
                user.Key = user.Lastname;
                user.Username = $"{user.DisplayName.Replace(" ", "").Replace("ClerkJudge", "Clerk")}{context.AdminWebConfig.TestConfig.TestUsernameStem}";
            }
        }

        private void RegisterHearingServices(TestContext context)
        {
            context.AdminWebConfig.VhServices = Options.Create(_configRoot.GetSection("VhServices").Get<AdminWebVhServiceConfig>()).Value;
            ConfigurationManager.VerifyConfigValuesSet(context.AdminWebConfig.VhServices).Should().BeTrue();
        }

        private void RegisterSauceLabsSettings(TestContext context)
        {
            context.AdminWebConfig.SauceLabsConfiguration = Options.Create(_configRoot.GetSection("Saucelabs").Get<SauceLabsSettingsConfig>()).Value;
            if (context.AdminWebConfig.SauceLabsConfiguration.RunningOnSauceLabs())
                context.AdminWebConfig.SauceLabsConfiguration.SetRemoteServerUrlForDesktop(context.AdminWebConfig.TestConfig.CommonData.CommonConfig.SauceLabsServerUrl);
        }

        private static void RunningAdminWebLocally(TestContext context)
        {
            context.AdminWebConfig.VhServices.RunningAdminWebLocally = context.AdminWebConfig.VhServices.AdminWebUrl.Contains("localhost");
        }

        private static async void GenerateBearerTokens(TestContext context)
        {
            context.Tokens.BookingsApiBearerToken = await ConfigurationManager.GetBearerToken(
                context.AdminWebConfig.AzureAdConfiguration, context.AdminWebConfig.VhServices.BookingsApiResourceId);
            context.Tokens.BookingsApiBearerToken.Should().NotBeNullOrEmpty();

            context.Tokens.UserApiBearerToken = await ConfigurationManager.GetBearerToken(
                context.AdminWebConfig.AzureAdConfiguration, context.AdminWebConfig.VhServices.UserApiResourceId);
            context.Tokens.UserApiBearerToken.Should().NotBeNullOrEmpty();

            context.Tokens.VideoApiBearerToken = await ConfigurationManager.GetBearerToken(
                context.AdminWebConfig.AzureAdConfiguration, context.AdminWebConfig.VhServices.VideoApiResourceId);
            context.Tokens.VideoApiBearerToken.Should().NotBeNullOrEmpty();

            context.Tokens.GraphApiToken = await ConfigurationManager.GetBearerToken(
                context.AdminWebConfig.AzureAdConfiguration, "https://graph.microsoft.com");
            context.Tokens.GraphApiToken.Should().NotBeNullOrEmpty();
        }
    }
}
