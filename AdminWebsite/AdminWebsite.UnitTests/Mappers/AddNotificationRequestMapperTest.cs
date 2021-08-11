using System;
using System.Collections.Generic;
using AdminWebsite.Mappers;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using NotificationApi.Contract;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers
{
    public class AddNotificationRequestMapperTest
    {
        [TestCase("Individual", NotificationType.CreateIndividual)]
        [TestCase("Staff Member", NotificationType.CreateStaffMember)]
        public void Should_map_properties_for_notification_request_for(string userRole, NotificationType notificationType)
        {
            var hearingId = Guid.NewGuid();
            var participantId = Guid.NewGuid();
            var firstName = "firstname";
            var lastName = "lastname";
            var userName = "username";
            var password = "randompassword";

            var parameters = new Dictionary<string, string>
            {
                {"name", $"{firstName} {lastName}"},
                {"username", $"{userName}"},
                {"random password", $"{password}"}
            };

            var source = new ParticipantResponse
            {
                Id = participantId,
                Username = userName,
                CaseRoleName = "caserolename",
                ContactEmail = "contact@hmcts.net",
                FirstName = firstName,
                HearingRoleName = "hearingrolename",
                LastName = lastName,
                TelephoneNumber = "0123456789",
                UserRoleName = userRole
            };

            var result = AddNotificationRequestMapper.MapToNewUserNotification(hearingId, source, password);

            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearingId);
            result.ParticipantId.Should().Be(participantId);
            result.ContactEmail.Should().Be(source.ContactEmail);
            result.NotificationType.Should().Be(notificationType);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(source.TelephoneNumber);
            result.Parameters.Should().BeEquivalentTo(parameters);
        }

        [Test]
        public void Should_map_properties_for_notification_request_for_representative()
        {
            var hearingId = Guid.NewGuid();
            var participantId = Guid.NewGuid();
            var firstName = "firstname";
            var lastName = "lastname";
            var userName = "username";
            var password = "randompassword";

            var parameters = new Dictionary<string, string>
            {
                {"name", $"{firstName} {lastName}"},
                {"username", $"{userName}"},
                {"random password", $"{password}"}
            };

            var source = new ParticipantResponse
            {
                Id = participantId,
                Username = userName,
                CaseRoleName = "caserolename",
                ContactEmail = "contact@hmcts.net",
                FirstName = firstName,
                HearingRoleName = "hearingrolename",
                LastName = lastName,
                TelephoneNumber = "0123456789",
                UserRoleName = "Representative"
            };

            var result = AddNotificationRequestMapper.MapToNewUserNotification(hearingId, source, password);

            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearingId);
            result.ParticipantId.Should().Be(participantId);
            result.ContactEmail.Should().Be(source.ContactEmail);
            result.NotificationType.Should().Be(NotificationType.CreateRepresentative);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(source.TelephoneNumber);
            result.Parameters.Should().BeEquivalentTo(parameters);
        }
    }
}
