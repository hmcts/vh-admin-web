using System;
using System.Collections.Generic;
using AdminWebsite.BookingsAPI.Client;
using AdminWebsite.Mappers;
using FluentAssertions;
using NotificationApi.Contract;
using NUnit.Framework;

namespace AdminWebsite.UnitTests.Mappers
{
    public class AddNotificationRequestMapperTest
    {
        [Test]
        public void Should_map_properties_for_notification_request_for_individual()
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
                Case_role_name = "caserolename",
                Contact_email = "contact@hmcts.net",
                First_name = firstName,
                Hearing_role_name = "hearingrolename",
                Last_name = lastName,
                Telephone_number = "0123456789",
                User_role_name = "Individual"
            };

            var result = AddNotificationRequestMapper.MapToNewUserNotification(hearingId, source, password);

            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearingId);
            result.ParticipantId.Should().Be(participantId);
            result.ContactEmail.Should().Be(source.Contact_email);
            result.NotificationType.Should().Be(NotificationType.CreateIndividual);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(source.Telephone_number);
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
                Case_role_name = "caserolename",
                Contact_email = "contact@hmcts.net",
                First_name = firstName,
                Hearing_role_name = "hearingrolename",
                Last_name = lastName,
                Telephone_number = "0123456789",
                User_role_name = "Representative"
            };

            var result = AddNotificationRequestMapper.MapToNewUserNotification(hearingId, source, password);

            result.Should().NotBeNull();
            result.HearingId.Should().Be(hearingId);
            result.ParticipantId.Should().Be(participantId);
            result.ContactEmail.Should().Be(source.Contact_email);
            result.NotificationType.Should().Be(NotificationType.CreateRepresentative);
            result.MessageType.Should().Be(MessageType.Email);
            result.PhoneNumber.Should().Be(source.Telephone_number);
            result.Parameters.Should().BeEquivalentTo(parameters);
        }
    }
}
