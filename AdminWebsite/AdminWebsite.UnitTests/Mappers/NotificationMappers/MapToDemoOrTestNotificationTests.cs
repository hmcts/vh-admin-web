using AdminWebsite.Mappers;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using NotificationApi.Contract;
using NUnit.Framework;
using System;
using System.Collections.Generic;
namespace AdminWebsite.UnitTests.Mappers.NotificationMappers
{
    public class MapToDemoOrTestNotificationTests
    {
        [Test]
        public void Should_map_joh_demo_or_test_notification()
        {
            //Arrange
            var hearing = new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                Participants = new List<ParticipantResponse>(),
                ScheduledDateTime = new DateTime(2020, 2, 10, 12, 15, 0, DateTimeKind.Utc)
            };
            const NotificationType expectedNotificationType = NotificationType.EJudJohDemoOrTest;
            const string testType = "Generic";
            const string caseNumber = "MBFY/17364";

            var participant = new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Username = "testusername@hmcts.net",
                CaseRoleName = "caserolename",
                ContactEmail = "contact@judiciary.hmcts.net",
                FirstName = "John",
                HearingRoleName = "hearingrolename",
                LastName = "Doe",
                TelephoneNumber = "0123456789",
                UserRoleName = "Judicial Office Holder",
                DisplayName = "Johnny",
            };

            hearing.Participants.Add(participant);

            var expectedParameters = new Dictionary<string, string>
            {
                {"case number", caseNumber},
                {"test type", "Generic"},
                {"date", "10 February 2020"},
                {"time", "12:15 PM"},
                {"judicial office holder", $"{participant.FirstName} {participant.LastName}"},
                {"username",$"{participant.Username.ToLower()}" }
            };

            //Act
            var result = AddNotificationRequestMapper.MapToDemoOrTestNotification(hearing, participant, caseNumber, testType);

            //Assert
            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.ContactEmail);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.TelephoneNumber);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }
        
        [Test]
        public void Should_map_participants_demo_or_test_notification()
        {
            //Arrange
            var hearing = new HearingDetailsResponse
            {
                Id = Guid.NewGuid(),
                Participants = new List<ParticipantResponse>(),
                ScheduledDateTime = new DateTime(2020, 2, 10, 12, 15, 0, DateTimeKind.Utc)
            };
            const NotificationType expectedNotificationType = NotificationType.ParticipantDemoOrTest;
            const string testType = "Generic";
            const string caseNumber = "MBFY/17364";

            var participant = new ParticipantResponse
            {
                Id = Guid.NewGuid(),
                Username = "testusername@hmcts.net",
                CaseRoleName = "caserolename",
                ContactEmail = "contact@judiciary.hmcts.net",
                FirstName = "John",
                HearingRoleName = "hearingrolename",
                LastName = "Doe",
                TelephoneNumber = "0123456789",
                UserRoleName = "Representative",
                DisplayName = "Johnny",
            };

            hearing.Participants.Add(participant);

            var expectedParameters = new Dictionary<string, string>
            {
                {"case number", caseNumber},
                {"test type", "Generic"},
                {"date", "10 February 2020"},
                {"time", "12:15 PM"},
                {"name", $"{participant.FirstName} {participant.LastName}"},
                {"username",$"{participant.Username.ToLower()}" }
            };

            //Act
            var result = AddNotificationRequestMapper.MapToDemoOrTestNotification(hearing, participant, caseNumber, testType);

            //Assert
            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearing.Id);
            result.ParticipantId.Should().Be(participant.Id);
            result.ContactEmail.Should().Be(participant.ContactEmail);
            result.NotificationType.Should().Be(expectedNotificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(participant.TelephoneNumber);
            result.Parameters.Should().BeEquivalentTo(expectedParameters);
        }
    }
}
