using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AdminWebsite.AcceptanceTests.Helpers;
using AdminWebsite.AcceptanceTests.Pages;
using AdminWebsite.TestAPI.Client;
using FluentAssertions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TechTalk.SpecFlow;

namespace AdminWebsite.AcceptanceTests.Steps
{
    [Binding]
    public class NotificationSteps
    {
        private readonly TestContext _testContext;
        private readonly Dictionary<User, UserBrowser> _browsers;

        public NotificationSteps(TestContext testContext,
             Dictionary<User, UserBrowser> browsers)
        {
            _testContext = testContext;
        }

        [Then(@"the participant has been notified")]
        public async Task ThenTheParticipantDetailsAreUpdated()
        {
            var allNotifications = await _testContext.NotifyClient.GetNotificationsAsync("email");
            var newUserPrefix = _testContext.Test.TestData.AddParticipant.Participant.NewUserPrefix;
            foreach (var participant in _testContext.Test.HearingParticipants)
            {
                var name =  $"{participant.Firstname} {participant.Lastname}";
                var username = participant.Username;
                var recentNotification = allNotifications.notifications.LastOrDefault(x => x.body.Contains(name) && x.body.Contains(username));
                if (participant.DisplayName.Contains(newUserPrefix))
                {
                    recentNotification.Should().NotBeNull();
                }
                else
                {
                    recentNotification.Should().BeNull();
                }
            }

        }
    }
}
