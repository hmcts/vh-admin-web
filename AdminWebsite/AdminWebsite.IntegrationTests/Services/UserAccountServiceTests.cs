using System;
using System.Linq;
using AdminWebsite.Configuration;
using AdminWebsite.Helper;
using AdminWebsite.IntegrationTests.Helper;
using AdminWebsite.Security;
using AdminWebsite.Services;
using AdminWebsite.UserAPI.Client;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using UserServiceException = AdminWebsite.Security.UserServiceException;

namespace AdminWebsite.IntegrationTests.Services
{
    public class UserAccountServiceTests
    {
        private const string TestJudgeEmail = "automation01judge01@hearings.reform.hmcts.net";
        
        private Mock<IUserApiClient> _apiClient;
        private IOptions<SecuritySettings> _securitySettings;
        private AppConfigSettings _appSettings;

        [SetUp]
        public void Setup()
        {
            _apiClient = new Mock<IUserApiClient>();
            
            _securitySettings = Options.Create(new TestSettings().Security);
            _appSettings = new AppConfigSettings();
        }

        private UserAccountService GetService()
        {
            var tokenProvider = new TokenProvider(_securitySettings);
            var appSettings = Options.Create(_appSettings);

            return new UserAccountService(
                _apiClient.Object, 
                tokenProvider, 
                _securitySettings,
                appSettings
            );
        }

        [Test]
        public void should_contain_test_users_if_live_setting_is_off()
        {
            _appSettings.IsLive = false;
            var judges = GetService().GetJudgeUsers().ToList();
            judges.Count.Should().BeGreaterThan(0);
            judges.Should().Contain(p =>
                p.Email.Equals(TestJudgeEmail, StringComparison.CurrentCultureIgnoreCase));
        }

        [Test]
        public void should_return_a_list_of_judges_excluding_test_users_if_live()
        {
            _appSettings.IsLive = true;
            var judges = GetService().GetJudgeUsers().ToList();
            judges.Count.Should().BeGreaterThan(0);
            judges.Should().NotContain(p =>
                p.Email.Equals(TestJudgeEmail, StringComparison.CurrentCultureIgnoreCase));
        }

        [Test]
        public void should_return_null_if_getting_group_name_of_group_that_cant_be_found()
        {
            const string invalidGroupId = "5F750C75-D771-44F5-8EF8-F194C6545F7A";
            var group = GetService().GetGroupById(invalidGroupId);
            group.Should().BeNull();
        }
        
        [Test]
        public void should_return_group_with_display_name_by_id()
        {
            var group = GetService().GetGroupById("f3340a0e-2ea2-45c6-b19c-d601b8dac13f");
            group.DisplayName.Should().Be("VirtualRoomProfessionalUser");
        }
        
        [Test]
        public void should_throw_exception_on_invalid_server_response_for_group_by_id()
        {
            Assert.Throws<UserServiceException>(() => GetService().GetGroupById("not a valid id"));
        }
    }
}