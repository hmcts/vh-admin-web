﻿using System.Collections.Generic;
using System.Threading.Tasks;
using AcceptanceTests.Common.Configuration;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Data.TestData;
using AcceptanceTests.Common.Exceptions;
using AdminWebsite.AcceptanceTests.Configuration;
using AdminWebsite.AcceptanceTests.Data;
using AdminWebsite.AcceptanceTests.Data.TestData;
using AdminWebsite.AcceptanceTests.Helpers;
using BookingsApi.Contract.Responses;
using TestApi.Contract.Dtos;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using TechTalk.SpecFlow;
using ConfigurationManager = AcceptanceTests.Common.Configuration.ConfigurationManager;
using HearingDetails = AdminWebsite.AcceptanceTests.Data.HearingDetails;
using AdminWebsite.Security;
using AdminWebsite.Configuration;

namespace AdminWebsite.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class ConfigHooks
    {
        private readonly IConfigurationRoot _configRoot;

        public ConfigHooks(TestContext context)
        {
            _configRoot = ConfigurationManager.BuildConfig("f99a3fe8-cf72-486a-b90f-b65c27da84ee", "ef943d1a-7506-483b-92b7-dc6e6b41270a");
            context.WebConfig = new AdminWebConfig();
            context.Users = new List<UserDto>();
        }

        [BeforeScenario(Order = (int)HooksSequence.ConfigHooks)]
        public async Task RegisterSecrets(TestContext context)
        {
            RegisterAzureSecrets(context);
            RegisterTestUserSecrets(context);
            RegisterDefaultData(context);
            RegisterHearingServices(context);
            RegisterIsLive(context);
            RegisterUsingEjud(context);
            RegisterSeleniumElementTimeout(context);
            RegisterWowzaSettings(context);
            RegisterSauceLabsSettings(context);
            RegisterKinlySettings(context);
            RegisterNotifySettings(context);
            RunningAdminWebLocally(context);
            await GenerateBearerTokens(context);            
            SetBookingConfirmToggleStatus(context);
        }

        private void RegisterAzureSecrets(TestContext context)
        {
            context.WebConfig.AzureAdConfiguration = Options.Create(_configRoot.GetSection("AzureAd").Get<AzureAdConfiguration>()).Value;
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
            context.WebConfig.VhServices = GetTargetTestEnvironment() == string.Empty ? Options.Create(_configRoot.GetSection("VhServices").Get<AdminWebVhServiceConfig>()).Value
                : Options.Create(_configRoot.GetSection($"Testing.{GetTargetTestEnvironment()}.VhServices").Get<AdminWebVhServiceConfig>()).Value;
            if (context.WebConfig.VhServices == null && GetTargetTestEnvironment() != string.Empty)
            {
                throw new TestSecretsFileMissingException(GetTargetTestEnvironment());
            }
            ConfigurationManager.VerifyConfigValuesSet(context.WebConfig.VhServices);
        }

        private void RegisterIsLive(TestContext context)
        {
            context.WebConfig.IsLive = _configRoot.GetValue<bool>("IsLive");
            context.WebConfig.Should().NotBeNull();
        }

        private void RegisterUsingEjud(TestContext context)
        {
            context.WebConfig.UsingEjud = _configRoot.GetValue<bool>("UsingEjud");
        }

        private void RegisterSeleniumElementTimeout(TestContext context)
        {
            context.WebConfig.SeleniumElementTimeout = _configRoot.GetValue<int>("SeleniumElementTimeout");
        }

        private void RegisterWowzaSettings(TestContext context)
        {
            context.WebConfig.Wowza = Options.Create(_configRoot.GetSection("WowzaConfiguration").Get<WowzaConfiguration>()).Value;
            ConfigurationManager.VerifyConfigValuesSet(context.WebConfig.Wowza);
        }

        private void RegisterKinlySettings(TestContext context)
        {
            context.WebConfig.KinlyConfiguration = Options.Create(_configRoot.GetSection("KinlyConfiguration").Get<KinlyConfiguration>()).Value;
            context.WebConfig.KinlyConfiguration.ConferencePhoneNumber.Should().NotBeNullOrWhiteSpace();
        }

        private void RegisterSauceLabsSettings(TestContext context)
        {
            context.WebConfig.SauceLabsConfiguration = RunOnSauceLabsFromLocal() ?  Options.Create(_configRoot.GetSection("LocalSaucelabs").Get<SauceLabsSettingsConfig>()).Value
                : Options.Create(_configRoot.GetSection("Saucelabs").Get<SauceLabsSettingsConfig>()).Value;
            if (!context.WebConfig.SauceLabsConfiguration.RunningOnSauceLabs()) return;
            context.WebConfig.SauceLabsConfiguration.SetRemoteServerUrlForDesktop(context.Test.CommonData.CommonConfig.SauceLabsServerUrl);
            context.WebConfig.SauceLabsConfiguration.AccessKey.Should().NotBeNullOrWhiteSpace();
            context.WebConfig.SauceLabsConfiguration.Username.Should().NotBeNullOrWhiteSpace();
            context.WebConfig.SauceLabsConfiguration.RealDeviceApiKey.Should().NotBeNullOrWhiteSpace();
        }

        private string GetTargetTestEnvironment()
        {
            return NUnit.Framework.TestContext.Parameters["TargetTestEnvironment"] ?? string.Empty;
        }

        private bool RunOnSauceLabsFromLocal()
        {
            return NUnit.Framework.TestContext.Parameters["RunOnSauceLabs"] != null &&
                   NUnit.Framework.TestContext.Parameters["RunOnSauceLabs"].Equals("true");
        }

        private void RegisterNotifySettings(TestContext context)
        {
            context.WebConfig.NotifyConfiguration = Options.Create(_configRoot.GetSection("NotifyConfiguration").Get<NotifyConfiguration>()).Value;
            ConfigurationManager.VerifyConfigValuesSet(context.WebConfig.NotifyConfiguration);
        }

        private void RunningAdminWebLocally(TestContext context)
        {
            context.WebConfig.VhServices.RunningAdminWebLocally = context.WebConfig.VhServices.AdminWebUrl.Contains("localhost");
        }

        private async Task GenerateBearerTokens(TestContext context)
        {
            var tokenProvider = new TokenProvider(Options.Create(context.WebConfig.AzureAdConfiguration));
            context.Token = await tokenProvider.GetClientAccessToken(context.WebConfig.AzureAdConfiguration.ClientId, context.WebConfig.AzureAdConfiguration.ClientSecret, context.WebConfig.VhServices.TestApiResourceId);
            context.Token.Should().NotBeNullOrEmpty();
        }
        
        private void SetBookingConfirmToggleStatus(TestContext context)
        { 
            var featureToggle = new FeatureToggles(_configRoot["FeatureToggle:SDK-Key"]);
            context.WebConfig.BookingConfirmToggle = featureToggle.BookAndConfirmToggle();
        }
    }
}
